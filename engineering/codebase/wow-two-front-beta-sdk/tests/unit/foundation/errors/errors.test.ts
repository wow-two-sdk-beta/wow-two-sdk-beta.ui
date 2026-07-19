import { describe, it, expect } from 'vitest';

import {
  DefaultErrorMessage,
  DefaultMaxCauseDepth,
  flattenErrorChain,
  getErrorCause,
  getErrorMessage,
  isAbortError,
  isErrorLike,
  isTimeoutError,
  serializeError,
  toError,
  type SerializedError,
} from '@src/foundation/errors';

/** Attaches a `cause` after construction — the only way to build a self- or mutually-referencing chain. */
const withCause = <T extends Error>(error: T, cause: unknown): T => Object.assign(error, { cause });

/** Builds a chain `link-{depth-1}` (head) → … → `link-0` (root). */
const buildChain = (depth: number): Error => {
  let error = new Error('link-0');
  for (let index = 1; index < depth; index += 1) error = new Error(`link-${index}`, { cause: error });
  return error;
};

/** Counts nested `cause` levels of a serialized error. */
const causeDepth = (serialized: SerializedError | undefined): number =>
  serialized === undefined ? 0 : 1 + causeDepth(serialized.cause);

describe('toError — passthrough', () => {
  it('returns an Error by identity, subclass intact', () => {
    class ApiIsh extends Error {}
    const error = new ApiIsh('kept');
    expect(toError(error)).toBe(error);
    expect(toError(error)).toBeInstanceOf(ApiIsh);

    const typeError = new TypeError('typed');
    expect(toError(typeError)).toBe(typeError);
  });

  it('is idempotent from the second call on', () => {
    const once = toError('boom');
    expect(toError(once)).toBe(once);
  });
});

describe('toError — error-like adoption', () => {
  it('adopts message, name, stack, and code', () => {
    const normalized = toError({
      message: 'adopted',
      name: 'CustomError',
      stack: 'CustomError: adopted\n    at origin',
      code: 'E_ADOPT',
    }) as Error & { code?: unknown };

    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.message).toBe('adopted');
    expect(normalized.name).toBe('CustomError');
    expect(normalized.stack).toBe('CustomError: adopted\n    at origin');
    expect(normalized.code).toBe('E_ADOPT');
  });

  it('adopts a numeric code and preserves cause', () => {
    const inner = new Error('inner');
    const normalized = toError({ message: 'outer', code: 20, cause: inner }) as Error & { code?: unknown };
    expect(normalized.code).toBe(20);
    expect(getErrorCause(normalized)).toBe(inner);
  });

  it('drops a non-JSON-safe code rather than carrying it', () => {
    const normalized = toError({ message: 'm', code: { nested: true } }) as Error & { code?: unknown };
    expect(normalized.code).toBeUndefined();
  });

  it('installs no cause member when the source had none', () => {
    expect(getErrorCause(toError({ message: 'no cause' }))).toBeUndefined();
  });
});

describe('toError — stringification', () => {
  it('normalizes a string to its own message', () => {
    const normalized = toError('boom');
    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.message).toBe('boom');
  });

  it('normalizes null and undefined', () => {
    expect(toError(null).message).toBe('null');
    expect(toError(undefined).message).toBe('undefined');
  });

  it('normalizes numbers, booleans, and bigints', () => {
    expect(toError(42).message).toBe('42');
    expect(toError(Number.NaN).message).toBe('NaN');
    expect(toError(false).message).toBe('false');
    expect(toError(9007199254740993n).message).toBe('9007199254740993');
  });

  it('normalizes a symbol (a template literal would throw)', () => {
    expect(toError(Symbol('sym')).message).toBe('Symbol(sym)');
  });

  it('normalizes functions', () => {
    expect(toError(function namedFn(): void {}).message).toBe('[Function namedFn]');
    expect(toError(() => undefined).message).toMatch(/^\[Function /);
  });

  it('normalizes a plain object through JSON, never the [object Object] tag', () => {
    const normalized = toError({ a: 1, b: 'two' });
    expect(normalized.message).toBe('{"a":1,"b":"two"}');
    expect(normalized.message).not.toBe('[object Object]');
  });

  it('survives a circular object (JSON.stringify throws)', () => {
    const circular: Record<string, unknown> = { id: 1 };
    circular['self'] = circular;
    expect(toError(circular).message).toBe('[unserializable Object]');
  });

  it('survives a BigInt member (JSON.stringify throws)', () => {
    expect(toError({ big: 1n }).message).toBe('[unserializable Object]');
  });

  it('survives a circular null-prototype object with no constructor to name', () => {
    const nullProto = Object.create(null) as Record<string, unknown>;
    nullProto['self'] = nullProto;
    expect(toError(nullProto).message).toBe('[unserializable value]');
  });
});

describe('getErrorMessage', () => {
  it('reads an Error and an error-like', () => {
    expect(getErrorMessage(new Error('from error'))).toBe('from error');
    expect(getErrorMessage({ message: 'from shape' })).toBe('from shape');
  });

  it('reads a string and trims it', () => {
    expect(getErrorMessage('  spaced  ')).toBe('spaced');
  });

  it('falls back when nothing usable is found', () => {
    expect(getErrorMessage(null)).toBe(DefaultErrorMessage);
    expect(getErrorMessage(undefined)).toBe(DefaultErrorMessage);
    expect(getErrorMessage({})).toBe(DefaultErrorMessage);
    expect(getErrorMessage(42)).toBe(DefaultErrorMessage);
    expect(getErrorMessage('   ')).toBe(DefaultErrorMessage);
    expect(getErrorMessage({ message: '' })).toBe(DefaultErrorMessage);
  });

  it('honors a custom fallback', () => {
    expect(getErrorMessage(null, 'Upload failed')).toBe('Upload failed');
    expect(getErrorMessage(new Error('real'), 'Upload failed')).toBe('real');
  });

  it('never returns an empty string, even for a blank custom fallback', () => {
    expect(getErrorMessage(null, '')).toBe(DefaultErrorMessage);
    expect(getErrorMessage(null, '   ')).toBe(DefaultErrorMessage);
  });

  it('never returns the [object Object] tag, even when it is the message', () => {
    expect(getErrorMessage({ message: '[object Object]' })).toBe(DefaultErrorMessage);
    expect(getErrorMessage('[object Object]')).toBe(DefaultErrorMessage);
  });

  it('exposes the default copy', () => {
    expect(DefaultErrorMessage).toBe('Something went wrong');
  });
});

describe('getErrorCause', () => {
  it('reads the standard cause', () => {
    const inner = new Error('inner');
    expect(getErrorCause(new Error('outer', { cause: inner }))).toBe(inner);
  });

  it('returns the raw value, not a normalized Error', () => {
    expect(getErrorCause(new Error('outer', { cause: 'root string' }))).toBe('root string');
  });

  it('returns undefined for no cause and for non-objects', () => {
    expect(getErrorCause(new Error('lonely'))).toBeUndefined();
    expect(getErrorCause('a string')).toBeUndefined();
    expect(getErrorCause(null)).toBeUndefined();
    expect(getErrorCause(undefined)).toBeUndefined();
  });
});

describe('flattenErrorChain', () => {
  it('walks head-first to the root', () => {
    const chain = flattenErrorChain(buildChain(3));
    expect(chain.map((error) => error.message)).toEqual(['link-2', 'link-1', 'link-0']);
  });

  it('always returns at least the head, even from undefined', () => {
    expect(flattenErrorChain(undefined).map((error) => error.message)).toEqual(['undefined']);
  });

  it('normalizes non-Error links', () => {
    const chain = flattenErrorChain(new Error('head', { cause: { message: 'shaped' } }));
    expect(chain.map((error) => error.message)).toEqual(['head', 'shaped']);
    expect(chain.at(1)).toBeInstanceOf(Error);
  });

  it('stops at a null cause', () => {
    expect(flattenErrorChain(withCause(new Error('head'), null))).toHaveLength(1);
  });

  it('terminates on a self-referencing cause', () => {
    const selfCaused = new Error('self');
    withCause(selfCaused, selfCaused);
    const chain = flattenErrorChain(selfCaused);
    expect(chain).toHaveLength(1);
    expect(chain.at(0)).toBe(selfCaused);
  });

  it('terminates on a mutually-referencing cause', () => {
    const first = new Error('first');
    const second = new Error('second', { cause: first });
    withCause(first, second);
    expect(flattenErrorChain(first).map((error) => error.message)).toEqual(['first', 'second']);
  });

  it('caps at DefaultMaxCauseDepth', () => {
    expect(DefaultMaxCauseDepth).toBe(8);
    expect(flattenErrorChain(buildChain(20))).toHaveLength(DefaultMaxCauseDepth);
  });

  it('honors a custom cap, flooring at the head', () => {
    expect(flattenErrorChain(buildChain(20), 3)).toHaveLength(3);
    expect(flattenErrorChain(buildChain(20), 0)).toHaveLength(1);
    expect(flattenErrorChain(buildChain(20), -5)).toHaveLength(1);
  });

  it('rejects a non-finite cap rather than walking forever', () => {
    expect(flattenErrorChain(buildChain(20), Number.POSITIVE_INFINITY)).toHaveLength(DefaultMaxCauseDepth);
    expect(flattenErrorChain(buildChain(20), Number.NaN)).toHaveLength(DefaultMaxCauseDepth);
  });
});

describe('isAbortError / isTimeoutError', () => {
  it('recognizes a real DOMException', () => {
    expect(typeof DOMException).toBe('function');
    expect(isAbortError(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
    expect(isTimeoutError(new DOMException('The operation timed out.', 'TimeoutError'))).toBe(true);
  });

  it('recognizes a plain shape and a renamed Error', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
    expect(isTimeoutError({ name: 'TimeoutError' })).toBe(true);

    const renamed = new Error('cancelled');
    renamed.name = 'AbortError';
    expect(isAbortError(renamed)).toBe(true);
  });

  it('does not match on the message', () => {
    expect(isAbortError(new Error('AbortError'))).toBe(false);
    expect(isTimeoutError(new Error('the request timed out'))).toBe(false);
  });

  it('does not confuse the two, and rejects non-errors', () => {
    expect(isTimeoutError({ name: 'AbortError' })).toBe(false);
    expect(isAbortError({ name: 'TimeoutError' })).toBe(false);
    for (const value of [null, undefined, 'AbortError', 42, {}]) {
      expect(isAbortError(value)).toBe(false);
      expect(isTimeoutError(value)).toBe(false);
    }
  });
});

describe('isErrorLike', () => {
  it('accepts anything with a string message', () => {
    expect(isErrorLike(new Error('real'))).toBe(true);
    expect(isErrorLike({ message: 'shaped' })).toBe(true);
    expect(isErrorLike({ message: '' })).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isErrorLike({ message: 42 })).toBe(false);
    expect(isErrorLike({})).toBe(false);
    expect(isErrorLike('a string')).toBe(false);
    expect(isErrorLike(null)).toBe(false);
    expect(isErrorLike(undefined)).toBe(false);
  });
});

describe('serializeError', () => {
  it('projects the members a logger needs (an Error JSON-stringifies to {})', () => {
    expect(JSON.stringify(new Error('opaque'))).toBe('{}');

    const error = new TypeError('bad input');
    const serialized = serializeError(error);
    expect(serialized.name).toBe('TypeError');
    expect(serialized.message).toBe('bad input');
    expect(typeof serialized.stack).toBe('string');
  });

  it('carries a code through normalization', () => {
    expect(serializeError({ message: 'timed out', name: 'TimeoutError', code: 'ETIMEDOUT' })).toMatchObject({
      name: 'TimeoutError',
      message: 'timed out',
      code: 'ETIMEDOUT',
    });
  });

  it('omits stack and code when the source has neither', () => {
    const error = new Error('no stack');
    delete error.stack;
    const serialized = serializeError(error);
    expect('stack' in serialized).toBe(false);
    expect('code' in serialized).toBe(false);
    expect('cause' in serialized).toBe(false);
  });

  it('nests the cause chain', () => {
    const serialized = serializeError(buildChain(3));
    expect(serialized.message).toBe('link-2');
    expect(serialized.cause?.message).toBe('link-1');
    expect(serialized.cause?.cause?.message).toBe('link-0');
    expect(serialized.cause?.cause?.cause).toBeUndefined();
  });

  it('serializes a non-Error input', () => {
    expect(serializeError('boom')).toMatchObject({ name: 'Error', message: 'boom' });
    expect(serializeError(null)).toMatchObject({ name: 'Error', message: 'null' });
  });

  it('round-trips through JSON.stringify', () => {
    const serialized = serializeError(new Error('outer', { cause: new Error('inner') }));
    const roundTripped = JSON.parse(JSON.stringify(serialized)) as SerializedError;
    expect(roundTripped.message).toBe('outer');
    expect(roundTripped.cause?.message).toBe('inner');
  });

  it('survives a circular cause and still round-trips', () => {
    const head = new Error('head');
    const inner = new Error('inner', { cause: head });
    withCause(head, inner);

    const serialized = serializeError(head);
    expect(causeDepth(serialized)).toBe(2);
    expect(() => JSON.stringify(serialized)).not.toThrow();
    expect(JSON.stringify(serialized)).toContain('"inner"');
  });

  it('survives a circular payload nested under the cause', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    const serialized = serializeError(new Error('head', { cause: circular }));
    expect(serialized.cause?.message).toBe('[unserializable Object]');
    expect(() => JSON.stringify(serialized)).not.toThrow();
  });

  it('honors the depth cap', () => {
    expect(causeDepth(serializeError(buildChain(20)))).toBe(DefaultMaxCauseDepth);
    expect(causeDepth(serializeError(buildChain(20), 2))).toBe(2);
  });
});

describe('never-throw contract', () => {
  /** Builds the hostile set fresh per helper — a throwing getter must not be shared state across cases. */
  const hostileInputs = (): Array<[string, unknown]> => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    const selfCaused = new Error('self-caused');
    withCause(selfCaused, selfCaused);

    const causeCycleWithShape = withCause(new Error('head'), { message: 'ring' });
    withCause(causeCycleWithShape, { message: 'ring', cause: causeCycleWithShape });

    const throwingGetters = {
      get message(): string {
        throw new Error('message getter');
      },
      get name(): string {
        throw new Error('name getter');
      },
      get stack(): string {
        throw new Error('stack getter');
      },
      get code(): string {
        throw new Error('code getter');
      },
      get cause(): unknown {
        throw new Error('cause getter');
      },
      get constructor(): unknown {
        throw new Error('constructor getter');
      },
    };

    const throwingGet = (): never => {
      throw new Error('get trap');
    };
    const throwingTraps: ProxyHandler<object> = {
      get: throwingGet,
      getPrototypeOf: (): never => {
        throw new Error('getPrototypeOf trap');
      },
      ownKeys: (): never => {
        throw new Error('ownKeys trap');
      },
      has: (): never => {
        throw new Error('has trap');
      },
    };

    const nullProto = Object.create(null) as Record<string, unknown>;
    nullProto['self'] = nullProto;

    return [
      ['null', null],
      ['undefined', undefined],
      ['number', Number.NaN],
      ['bigint', 1n],
      ['symbol', Symbol('hostile')],
      ['empty string', ''],
      ['function', (): void => undefined],
      ['empty object', {}],
      ['circular object', circular],
      ['circular null-prototype object', nullProto],
      ['bigint member', { big: 1n }],
      ['self-caused error', selfCaused],
      ['cause ring through a shape', causeCycleWithShape],
      ['throwing getters', throwingGetters],
      [
        'throwing toJSON',
        {
          message: 'ok',
          toJSON: (): never => {
            throw new Error('toJSON');
          },
        },
      ],
      ['throwing proxy', new Proxy({}, throwingTraps)],
      // `get`-only: `instanceof Error` still passes (no `getPrototypeOf` trap), so this reaches the
      // property-read paths that a fully-trapped proxy short-circuits.
      ['proxied error', new Proxy(new Error('proxied'), { get: throwingGet })],
      ['array', [1, 2, 3]],
      ['date', new Date(0)],
      ['message-less error', Object.assign(new Error(), { message: 42 })],
    ];
  };

  const helpers: Array<[string, (value: unknown) => unknown]> = [
    ['toError', (value) => toError(value)],
    ['getErrorMessage', (value) => getErrorMessage(value)],
    ['getErrorCause', (value) => getErrorCause(value)],
    ['flattenErrorChain', (value) => flattenErrorChain(value)],
    ['isAbortError', (value) => isAbortError(value)],
    ['isTimeoutError', (value) => isTimeoutError(value)],
    ['isErrorLike', (value) => isErrorLike(value)],
    ['serializeError', (value) => serializeError(value)],
  ];

  for (const [helperName, helper] of helpers) {
    it(`${helperName} never throws`, () => {
      for (const [inputName, value] of hostileInputs()) {
        expect(() => helper(value), `${helperName}(${inputName})`).not.toThrow();
      }
    });
  }

  it('still produces usable output for hostile inputs', () => {
    for (const [inputName, value] of hostileInputs()) {
      const message = getErrorMessage(value);
      expect(message, inputName).not.toBe('');
      expect(message, inputName).not.toBe('[object Object]');
      expect(toError(value), inputName).toBeInstanceOf(Error);
      expect(() => JSON.stringify(serializeError(value)), inputName).not.toThrow();
    }
  });
});
