import { afterEach, describe, expect, it } from 'vitest';

import {
  ConfigError,
  bool,
  defineConfig,
  json,
  list,
  num,
  oneOf,
  port,
  resolveRaw,
  staticSource,
  str,
  url,
  windowConfigSource,
} from '@src/foundation/config';

// These run in vitest's `node` project — no DOM, so `window` is genuinely `undefined` and the SSR paths are the
// real default. Resolution is made deterministic by passing an explicit `staticSource`, so no test depends on
// the ambient `import.meta.env` or a fake `window`.

/** Sugar: one static source over a record. */
function source(values: Record<string, string | undefined>) {
  return { sources: [staticSource(values)] };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('field parsers', () => {
  it('parses every scalar type from its raw string', () => {
    const config = defineConfig(
      {
        NAME: str(),
        COUNT: num(),
        FLAG: bool(),
        MODE: oneOf(['dev', 'prod']),
        API: url(),
        PORT: port(),
        JSON: json<{ a: number }>(),
        TAGS: list(),
      },
      source({
        NAME: 'wow',
        COUNT: '42',
        FLAG: 'yes',
        MODE: 'prod',
        API: 'https://api.example.com',
        PORT: '8080',
        JSON: '{"a":1}',
        TAGS: 'a, b ,,c',
      }),
    );

    expect(config).toEqual({
      NAME: 'wow',
      COUNT: 42,
      FLAG: true,
      MODE: 'prod',
      API: 'https://api.example.com',
      PORT: 8080,
      JSON: { a: 1 },
      TAGS: ['a', 'b', 'c'],
    });
  });

  it('accepts every documented boolean spelling, case-insensitively', () => {
    for (const raw of ['true', '1', 'YES', 'On']) {
      expect(defineConfig({ B: bool() }, source({ B: raw })).B).toBe(true);
    }
    for (const raw of ['false', '0', 'NO', 'Off']) {
      expect(defineConfig({ B: bool() }, source({ B: raw })).B).toBe(false);
    }
  });

  it('narrows an oneOf field to its literal union', () => {
    const config = defineConfig({ LEVEL: oneOf(['low', 'high']) }, source({ LEVEL: 'high' }));
    // Type-level: `config.LEVEL` is `'low' | 'high'`. Runtime asserts the value round-trips.
    const level: 'low' | 'high' = config.LEVEL;
    expect(level).toBe('high');
  });
});

describe('presence policy', () => {
  it('falls back to a default when the key is absent', () => {
    const config = defineConfig({ PORT: port({ default: 3000 }) }, source({}));
    expect(config.PORT).toBe(3000);
  });

  it('treats an empty string as absent (falls through to the default)', () => {
    const config = defineConfig({ NAME: str({ default: 'fallback' }) }, source({ NAME: '' }));
    expect(config.NAME).toBe('fallback');
  });

  it('resolves an optional field with no default to undefined', () => {
    const config = defineConfig({ OPTIONAL: str({ required: false }) }, source({}));
    // Type-level: `config.OPTIONAL` is `string | undefined`.
    const value: string | undefined = config.OPTIONAL;
    expect(value).toBeUndefined();
  });

  it('prefers a present value over its default', () => {
    const config = defineConfig({ PORT: port({ default: 3000 }) }, source({ PORT: '9000' }));
    expect(config.PORT).toBe(9000);
  });
});

describe('aggregated failure', () => {
  it('throws one ConfigError listing every missing and invalid key', () => {
    let caught: unknown;
    try {
      defineConfig(
        { A: str(), B: num(), C: oneOf(['x', 'y']) },
        source({ B: 'not-a-number', C: 'z' }),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ConfigError);
    const issues = (caught as ConfigError).issues;
    expect(issues).toHaveLength(3);
    expect(issues.find((i) => i.key === 'A')?.reason).toBe('missing');
    expect(issues.find((i) => i.key === 'B')?.reason).toBe('invalid');
    expect(issues.find((i) => i.key === 'C')?.reason).toBe('invalid');
  });

  it('redacts a secret field raw value from the error message', () => {
    let caught: ConfigError | undefined;
    try {
      defineConfig({ TOKEN: url({ secret: true }) }, source({ TOKEN: 'super-secret-not-a-url' }));
    } catch (error) {
      caught = error as ConfigError;
    }
    expect(caught?.message).not.toContain('super-secret-not-a-url');
    expect(caught?.issues[0]?.message).toContain('redacted');
  });

  it('rejects an out-of-range port', () => {
    expect(() => defineConfig({ P: port() }, source({ P: '70000' }))).toThrow(ConfigError);
  });

  it('rejects malformed JSON', () => {
    expect(() => defineConfig({ J: json() }, source({ J: '{bad' }))).toThrow(ConfigError);
  });
});

describe('sources & prefix', () => {
  it('lets an earlier source win over a later one', () => {
    const config = defineConfig(
      { KEY: str() },
      { sources: [staticSource({ KEY: 'runtime' }), staticSource({ KEY: 'buildtime' })] },
    );
    expect(config.KEY).toBe('runtime');
  });

  it('falls through to a later source when the earlier one is empty', () => {
    const config = defineConfig(
      { KEY: str() },
      { sources: [staticSource({ KEY: '' }), staticSource({ KEY: 'buildtime' })] },
    );
    expect(config.KEY).toBe('buildtime');
  });

  it('applies a prefix to every lookup key', () => {
    const config = defineConfig({ API_URL: url() }, { ...source({ VITE_API_URL: 'https://x.dev' }), prefix: 'VITE_' });
    expect(config.API_URL).toBe('https://x.dev');
    // The issue lookupKey carries the prefix on failure.
    try {
      defineConfig({ MISSING: str() }, { sources: [staticSource({})], prefix: 'VITE_' });
    } catch (error) {
      expect((error as ConfigError).issues[0]?.lookupKey).toBe('VITE_MISSING');
    }
  });
});

describe('result object', () => {
  it('is frozen', () => {
    const config = defineConfig({ NAME: str() }, source({ NAME: 'x' }));
    expect(Object.isFrozen(config)).toBe(true);
  });
});

describe('source helpers', () => {
  it('windowConfigSource is empty without a window', () => {
    expect(windowConfigSource()).toEqual({});
  });

  it('windowConfigSource reads the injected runtime global', () => {
    (globalThis as { window?: unknown }).window = { __APP_CONFIG__: { KEY: 'live' } };
    expect(windowConfigSource().KEY).toBe('live');
  });

  it('resolveRaw coerces a non-string hit to its string form', () => {
    expect(resolveRaw([staticSource({ N: 5 as unknown as string })], 'N')).toBe('5');
  });
});
