// Exercises the one guarantee the whole module rests on: every evaluation is TOTAL — it returns the
// type asked for and never throws, whatever the provider does. Each failure mode gets its own case
// (miss · disabled · wrong wire type · throwing provider · provider-reported failure), because the
// value is identical in all five and only `reason` / `errorCode` / `onError` tell them apart.
import { describe, it, expect, vi } from 'vitest';

import {
  createFlagClient,
  staticFlagProvider,
  FlagErrorCode,
  FlagReason,
  type FlagProvider,
  type FlagResolution,
  type JsonObject,
} from '@src/flags';

/** Builds a provider from partial overrides — unspecified types resolve nothing (`undefined` = not configured). */
function fakeProvider(overrides: Partial<FlagProvider> = {}): FlagProvider {
  return {
    name: 'fake',
    resolveBoolean: () => undefined,
    resolveString: () => undefined,
    resolveNumber: () => undefined,
    resolveObject: () => undefined,
    ...overrides,
  };
}

describe('createFlagClient — typed getters', () => {
  const client = createFlagClient({
    provider: staticFlagProvider({
      newNav: true,
      theme: 'dark',
      rowLimit: 25,
      limits: { max: 25, label: 'pro' }, // bare object flag — no `value` key, so not a definition
      wrapped: { value: { max: 50, label: 'team' } }, // long form — the definition wrapper
    }),
  });

  it('reads a boolean flag', () => {
    expect(client.getBoolean('newNav', false)).toBe(true);
  });

  it('reads a string flag', () => {
    expect(client.getString('theme', 'light')).toBe('dark');
  });

  it('reads a number flag', () => {
    expect(client.getNumber('rowLimit', 10)).toBe(25);
  });

  it('reads a bare object flag', () => {
    expect(client.getObject('limits', { max: 10, label: 'free' })).toEqual({ max: 25, label: 'pro' });
  });

  it('reads an object flag written in the definition long form', () => {
    expect(client.getObject('wrapped', { max: 10, label: 'free' })).toEqual({ max: 50, label: 'team' });
  });

  it('reports a configured value as reason static', () => {
    expect(client.evaluateBoolean('newNav', false)).toEqual({ key: 'newNav', value: true, reason: FlagReason.Static, variant: undefined });
  });
});

describe('createFlagClient — missing flags fall back without erroring', () => {
  it('returns the caller default with reason default', () => {
    const client = createFlagClient({ provider: staticFlagProvider({}) });
    expect(client.evaluateBoolean('absent', true)).toEqual({ key: 'absent', value: true, reason: FlagReason.Default });
  });

  it('carries no errorCode and never reaches onError — an unconfigured flag is not a fault', () => {
    const onError = vi.fn();
    const client = createFlagClient({ provider: staticFlagProvider({}), onError });

    expect(client.evaluateString('absent', 'fallback').errorCode).toBeUndefined();
    expect(client.getNumber('absent', 7)).toBe(7);
    expect(client.getObject('absent', { a: 1 })).toEqual({ a: 1 });
    expect(onError).not.toHaveBeenCalled();
  });

  it('defaults every flag when created with no provider at all', () => {
    const client = createFlagClient();
    expect(client.getBoolean('anything', false)).toBe(false);
    expect(client.evaluateBoolean('anything', false).reason).toBe(FlagReason.Default);
  });
});

describe('createFlagClient — type mismatch', () => {
  it('routes a string on a boolean flag to the default with reason error', () => {
    const onError = vi.fn();
    const client = createFlagClient({ provider: staticFlagProvider({ newNav: 'yes' }), onError });

    const evaluation = client.evaluateBoolean('newNav', false);

    expect(evaluation.value).toBe(false);
    expect(evaluation.reason).toBe(FlagReason.Error);
    expect(evaluation.errorCode).toBe(FlagErrorCode.TypeMismatch);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'newNav', errorCode: FlagErrorCode.TypeMismatch }),
    );
  });

  it('rejects a number on a string flag', () => {
    const client = createFlagClient({ provider: staticFlagProvider({ theme: 42 }) });
    expect(client.getString('theme', 'light')).toBe('light');
    expect(client.evaluateString('theme', 'light').errorCode).toBe(FlagErrorCode.TypeMismatch);
  });

  it('rejects NaN on a number flag — a broken payload, not a strange number', () => {
    const client = createFlagClient({ provider: staticFlagProvider({ ratio: Number.NaN }) });
    expect(client.getNumber('ratio', 0.5)).toBe(0.5);
    expect(client.evaluateNumber('ratio', 0.5).errorCode).toBe(FlagErrorCode.TypeMismatch);
  });

  it('rejects an array on an object flag', () => {
    // Deliberate wire-lie: a real adapter's payload is untyped, so the cast reproduces what a stale
    // flag definition actually sends.
    const provider = fakeProvider({ resolveObject: () => ({ value: [1, 2] as unknown as JsonObject }) });
    const client = createFlagClient({ provider });

    expect(client.getObject('items', { max: 1 })).toEqual({ max: 1 });
    expect(client.evaluateObject('items', { max: 1 }).errorCode).toBe(FlagErrorCode.TypeMismatch);
  });

  it('keeps the getter total — a mismatch never throws', () => {
    const client = createFlagClient({ provider: staticFlagProvider({ newNav: 'yes' }) });
    expect(() => client.getBoolean('newNav', false)).not.toThrow();
  });
});

describe('createFlagClient — provider faults', () => {
  const boom = new Error('flag backend unreachable');
  const throwing = fakeProvider({
    name: 'throwing',
    resolveBoolean: () => {
      throw boom;
    },
  });

  it('isolates a throwing provider and falls back to the default', () => {
    const client = createFlagClient({ provider: throwing });
    const evaluation = client.evaluateBoolean('newNav', true);

    expect(evaluation.value).toBe(true);
    expect(evaluation.reason).toBe(FlagReason.Error);
    expect(evaluation.errorCode).toBe(FlagErrorCode.ProviderError);
  });

  it('reports the throw to onError with the original cause', () => {
    const onError = vi.fn();
    createFlagClient({ provider: throwing, onError }).getBoolean('newNav', false);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'newNav', errorCode: FlagErrorCode.ProviderError, cause: boom }),
    );
  });

  it('never propagates the throw to the caller', () => {
    const client = createFlagClient({ provider: throwing });
    expect(() => client.getBoolean('newNav', false)).not.toThrow();
  });

  it('honours a provider-reported failure carried on the resolution', () => {
    const onError = vi.fn();
    const provider = fakeProvider({
      resolveNumber: (): FlagResolution<number> => ({ value: 0, errorCode: FlagErrorCode.ProviderError, errorMessage: 'stale cache' }),
    });
    const client = createFlagClient({ provider, onError });

    const evaluation = client.evaluateNumber('rowLimit', 10);

    expect(evaluation.value).toBe(10); // the reported value is discarded, the caller's default stands
    expect(evaluation.reason).toBe(FlagReason.Error);
    expect(evaluation.errorMessage).toBe('stale cache');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ key: 'rowLimit', message: 'stale cache' }));
  });
});

describe('createFlagClient — disabled gate', () => {
  const provider = staticFlagProvider({
    legacyExport: { value: true, variant: 'on', disabled: true, rules: [{ when: { plan: 'pro' }, value: true }] },
  });

  it('returns the CALLER default, not the stored value', () => {
    const client = createFlagClient({ provider, context: { plan: 'pro' } });
    expect(client.getBoolean('legacyExport', false)).toBe(false);
  });

  it('reports reason disabled and skips the rules', () => {
    const client = createFlagClient({ provider, context: { plan: 'pro' } });
    const evaluation = client.evaluateBoolean('legacyExport', false);

    expect(evaluation.reason).toBe(FlagReason.Disabled);
    expect(evaluation.variant).toBe('on');
  });

  it('is not a fault — never reaches onError', () => {
    const onError = vi.fn();
    createFlagClient({ provider, onError }).getBoolean('legacyExport', false);
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('createFlagClient — targeting', () => {
  const provider = staticFlagProvider({
    theme: {
      value: 'light',
      variant: 'control',
      rules: [{ when: { plan: ['pro', 'team'] }, value: 'dark', variant: 'treatment' }],
    },
    beta: { value: false, rules: [{ when: { targetingKey: 'u-42' }, value: true }] },
    bulkEdit: { value: false, rules: [{ when: (context) => typeof context.seats === 'number' && context.seats > 50, value: true }] },
    audit: { value: false, rules: [{ when: { roles: 'admin' }, value: true }] },
  });

  it('serves the configured value with reason static when no rule matches', () => {
    const evaluation = createFlagClient({ provider }).evaluateString('theme', 'light');
    expect(evaluation).toEqual({ key: 'theme', value: 'light', reason: FlagReason.Static, variant: 'control' });
  });

  it('serves a rule value with reason targeting and the rule variant', () => {
    const evaluation = createFlagClient({ provider, context: { plan: 'pro' } }).evaluateString('theme', 'light');
    expect(evaluation).toEqual({ key: 'theme', value: 'dark', reason: FlagReason.Targeting, variant: 'treatment' });
  });

  it('matches an "is one of" list condition', () => {
    expect(createFlagClient({ provider, context: { plan: 'team' } }).getString('theme', 'light')).toBe('dark');
    expect(createFlagClient({ provider, context: { plan: 'free' } }).getString('theme', 'light')).toBe('light');
  });

  it('targets on targetingKey', () => {
    expect(createFlagClient({ provider, context: { targetingKey: 'u-42' } }).getBoolean('beta', false)).toBe(true);
    expect(createFlagClient({ provider, context: { targetingKey: 'u-7' } }).getBoolean('beta', false)).toBe(false);
  });

  it('matches a predicate condition', () => {
    expect(createFlagClient({ provider, context: { seats: 80 } }).getBoolean('bulkEdit', false)).toBe(true);
    expect(createFlagClient({ provider, context: { seats: 8 } }).getBoolean('bulkEdit', false)).toBe(false);
  });

  it('matches a scalar condition against a multi-value attribute', () => {
    expect(createFlagClient({ provider, context: { roles: ['billing', 'admin'] } }).getBoolean('audit', false)).toBe(true);
    expect(createFlagClient({ provider, context: { roles: ['billing'] } }).getBoolean('audit', false)).toBe(false);
  });

  it('overrides the client context for one call only', () => {
    const client = createFlagClient({ provider, context: { plan: 'free' } });

    expect(client.getString('theme', 'light', { plan: 'pro' })).toBe('dark');
    expect(client.getString('theme', 'light')).toBe('light'); // client-wide context untouched
    expect(client.getContext()).toEqual({ plan: 'free' });
  });
});

describe('createFlagClient — evaluation context', () => {
  const provider = staticFlagProvider({
    theme: { value: 'light', rules: [{ when: { plan: 'pro' }, value: 'dark' }] },
  });

  it('merges over the existing context rather than replacing it', () => {
    const client = createFlagClient({ provider, context: { targetingKey: 'u-1', plan: 'free' } });

    client.setContext({ plan: 'pro' });

    expect(client.getContext()).toEqual({ targetingKey: 'u-1', plan: 'pro' });
    expect(client.getString('theme', 'light')).toBe('dark');
  });

  it('removes an attribute set to undefined', () => {
    const client = createFlagClient({ provider, context: { targetingKey: 'u-1', plan: 'pro' } });

    client.setContext({ plan: undefined });

    expect(client.getContext()).toEqual({ targetingKey: 'u-1' });
    expect(client.getString('theme', 'light')).toBe('light');
  });

  it('notifies subscribers on a real change', () => {
    const client = createFlagClient({ provider });
    const listener = vi.fn();
    client.subscribe(listener);

    client.setContext({ plan: 'pro' });

    expect(listener).toHaveBeenCalledWith({ plan: 'pro' });
  });

  it('no-ops a merge that changes nothing — what stops a per-render context object looping', () => {
    const client = createFlagClient({ provider, context: { plan: 'pro', roles: ['admin'] } });
    const listener = vi.fn();
    client.subscribe(listener);

    client.setContext({ plan: 'pro' });
    client.setContext({ roles: ['admin'] }); // fresh array, equal element-wise

    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribe stops delivery', () => {
    const client = createFlagClient({ provider });
    const listener = vi.fn();
    const unsubscribe = client.subscribe(listener);

    client.setContext({ plan: 'pro' });
    unsubscribe();
    client.setContext({ plan: 'free' });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies the provider so a remote adapter can refetch', () => {
    const onContextChange = vi.fn();
    const client = createFlagClient({ provider: fakeProvider({ onContextChange }) });

    client.setContext({ targetingKey: 'u-9' });

    expect(onContextChange).toHaveBeenCalledWith({ targetingKey: 'u-9' });
  });

  it('routes a throwing onContextChange to onError instead of the caller', () => {
    const onError = vi.fn();
    const client = createFlagClient({
      provider: fakeProvider({
        onContextChange: () => {
          throw new Error('refetch failed');
        },
      }),
      onError,
    });

    expect(() => client.setContext({ targetingKey: 'u-9' })).not.toThrow();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ errorCode: FlagErrorCode.ProviderError }));
  });

  it('routes a rejected onContextChange to onError instead of an unhandled rejection', async () => {
    const onError = vi.fn();
    const cause = new Error('refetch rejected');
    const client = createFlagClient({
      provider: fakeProvider({ onContextChange: () => Promise.reject(cause) }),
      onError,
    });

    client.setContext({ targetingKey: 'u-9' });
    await Promise.resolve(); // let the rejection settle

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ errorCode: FlagErrorCode.ProviderError, cause }));
  });
});

describe('createFlagClient — evaluate/getValue dispatch on the default type', () => {
  const client = createFlagClient({
    provider: staticFlagProvider({ newNav: true, theme: 'dark', rowLimit: 25, limits: { max: 25 } }),
  });

  it('picks the boolean path', () => {
    expect(client.getValue('newNav', false)).toBe(true);
  });

  it('picks the string path', () => {
    expect(client.getValue('theme', 'light')).toBe('dark');
  });

  it('picks the number path', () => {
    expect(client.getValue('rowLimit', 10)).toBe(25);
  });

  it('picks the object path', () => {
    expect(client.getValue('limits', { max: 10 })).toEqual({ max: 25 });
  });

  it('reports the full evaluation like the typed variants', () => {
    expect(client.evaluate('theme', 'light')).toEqual({ key: 'theme', value: 'dark', reason: FlagReason.Static, variant: undefined });
  });

  it('stays total for a default type only untyped JS could pass', () => {
    const onError = vi.fn();
    const untyped = createFlagClient({ provider: staticFlagProvider({}), onError }) as unknown as {
      getValue(key: string, defaultValue: unknown): unknown;
    };

    expect(untyped.getValue('anything', null)).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ errorCode: FlagErrorCode.InvalidDefault }));
  });
});
