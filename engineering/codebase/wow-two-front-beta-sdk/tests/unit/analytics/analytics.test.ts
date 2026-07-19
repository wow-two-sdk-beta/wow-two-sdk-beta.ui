import { describe, it, expect, vi } from 'vitest';

import {
  AnalyticsCallKind,
  AnalyticsFailurePhase,
  DefaultPageName,
  analytics,
  consoleAnalyticsProvider,
  createAnalytics,
  memoryAnalyticsProvider,
  track,
  type AnalyticsProvider,
} from '@src/analytics';

/** Freezes the clock so every asserted event carries a known timestamp. */
const at = (timestamp: number) => () => timestamp;

/** Builds a sink whose `track` always throws — the broken third-party adapter. */
const throwingProvider = (error: unknown): AnalyticsProvider => ({
  name: 'broken',
  track: () => {
    throw error;
  },
});

describe('createAnalytics — fan-out', () => {
  it('delivers a track call to every registered provider', () => {
    const first = memoryAnalyticsProvider();
    const second = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [first, second], now: at(1_000) });

    client.track('signup_completed', { plan: 'pro' });

    const event = { name: 'signup_completed', properties: { plan: 'pro' }, timestamp: 1_000 };
    expect(first.events).toEqual([event]);
    expect(second.events).toEqual([event]);
  });

  it('routes each canonical call to its own provider method, preserving order', () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink], now: at(1) });

    client.track('clicked');
    client.identify('u_1', { plan: 'pro' });
    client.page();

    expect(sink.events).toEqual([{ name: 'clicked', timestamp: 1 }]);
    expect(sink.identities).toEqual([{ userId: 'u_1', traits: { plan: 'pro' }, timestamp: 1 }]);
    expect(sink.pages).toEqual([{ name: DefaultPageName, timestamp: 1 }]);
    expect(sink.calls.map((call) => call.kind)).toEqual([
      AnalyticsCallKind.Track,
      AnalyticsCallKind.Identify,
      AnalyticsCallKind.Page,
    ]);
  });

  it('page takes the given name over the default', () => {
    const sink = memoryAnalyticsProvider();
    createAnalytics({ providers: [sink], now: at(2) }).page('/pricing', { referrer: 'nav' });

    expect(sink.pages).toEqual([{ name: '/pricing', properties: { referrer: 'nav' }, timestamp: 2 }]);
  });

  it('omits properties entirely when there are none', () => {
    const sink = memoryAnalyticsProvider();
    createAnalytics({ providers: [sink], now: at(3) }).track('bare');

    expect(sink.events).toEqual([{ name: 'bare', timestamp: 3 }]);
  });

  it('skips a provider that does not implement the call', () => {
    const partial: AnalyticsProvider = { name: 'track-only', track: vi.fn() };
    const client = createAnalytics({ providers: [partial] });

    expect(() => client.identify('u_1')).not.toThrow();
    expect(() => client.page()).not.toThrow();
  });

  it('unregister stops delivery without touching the other providers', () => {
    const first = memoryAnalyticsProvider();
    const second = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [second] });
    const unregisterFirst = client.register(first);

    client.track('one');
    unregisterFirst();
    client.track('two');

    expect(first.events.map((event) => event.name)).toEqual(['one']);
    expect(second.events.map((event) => event.name)).toEqual(['one', 'two']);
  });
});

describe('createAnalytics — enabled gate', () => {
  it('disabled: every call is a no-op', () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink], enabled: false });

    client.track('clicked');
    client.identify('u_1');
    client.page();

    expect(client.isEnabled()).toBe(false);
    expect(sink.calls).toEqual([]);
  });

  it('setEnabled flips dispatch at runtime — consent resolves after construction', () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink], enabled: false });

    client.track('before');
    client.setEnabled(true);
    client.track('after');

    expect(client.isEnabled()).toBe(true);
    expect(sink.events.map((event) => event.name)).toEqual(['after']);
  });

  it('disabling drops what is still buffered — denied consent must not ship on re-enable', () => {
    const client = createAnalytics();

    client.track('pre_consent');
    client.setEnabled(false);
    client.setEnabled(true);

    const sink = memoryAnalyticsProvider();
    client.register(sink);

    expect(sink.calls).toEqual([]);
  });
});

describe('createAnalytics — super-properties', () => {
  it('merges context into every event, the call site winning on a key clash', () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink], context: { app: 'web', tier: 'free' }, now: at(1) });

    client.track('clicked', { tier: 'pro' });
    client.page('/home');

    expect(sink.events).toEqual([{ name: 'clicked', properties: { app: 'web', tier: 'pro' }, timestamp: 1 }]);
    expect(sink.pages).toEqual([{ name: '/home', properties: { app: 'web', tier: 'free' }, timestamp: 1 }]);
  });

  it('setContext merges rather than replaces; clearContext drops everything', () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink], context: { app: 'web' }, now: at(1) });

    client.setContext({ tier: 'pro' });
    expect(client.getContext()).toEqual({ app: 'web', tier: 'pro' });

    client.track('with_context');
    client.clearContext();
    client.track('without_context');

    expect(client.getContext()).toEqual({});
    expect(sink.events).toEqual([
      { name: 'with_context', properties: { app: 'web', tier: 'pro' }, timestamp: 1 },
      { name: 'without_context', timestamp: 1 },
    ]);
  });

  it('never merges super-properties into identify traits', () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink], context: { app: 'web' }, now: at(1) });

    client.identify('u_1', { email: 'a@b.c' });

    expect(sink.identities).toEqual([{ userId: 'u_1', traits: { email: 'a@b.c' }, timestamp: 1 }]);
  });

  it('getContext returns a copy — mutating it cannot corrupt the client', () => {
    const client = createAnalytics({ context: { app: 'web' } });

    const snapshot = client.getContext();
    snapshot.app = 'tampered';

    expect(client.getContext()).toEqual({ app: 'web' });
  });
});

describe('createAnalytics — provider failure isolation', () => {
  it('a throwing provider breaks neither the caller nor the other sinks, and reports to onError', () => {
    const boom = new Error('sink down');
    const broken = throwingProvider(boom);
    const healthy = memoryAnalyticsProvider();
    const onError = vi.fn();
    const client = createAnalytics({ providers: [broken, healthy], onError, now: at(1) });

    expect(() => client.track('clicked')).not.toThrow();

    expect(healthy.events).toEqual([{ name: 'clicked', timestamp: 1 }]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(boom, {
      provider: broken,
      phase: AnalyticsFailurePhase.Track,
      call: { kind: AnalyticsCallKind.Track, event: { name: 'clicked', timestamp: 1 } },
    });
  });

  it('swallows a sink failure when no onError is supplied', () => {
    const client = createAnalytics({ providers: [throwingProvider(new Error('sink down'))] });

    expect(() => client.track('clicked')).not.toThrow();
  });

  it('routes a rejected provider promise to onError instead of an unhandled rejection', async () => {
    const boom = new Error('network');
    const broken: AnalyticsProvider = { name: 'async-broken', track: () => Promise.reject(boom) };
    const onError = vi.fn();
    const client = createAnalytics({ providers: [broken], onError });

    client.track('clicked');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onError).toHaveBeenCalledWith(boom, expect.objectContaining({ phase: AnalyticsFailurePhase.Track }));
  });

  it('survives an onError that itself throws', () => {
    const client = createAnalytics({
      providers: [throwingProvider(new Error('sink down'))],
      onError: () => {
        throw new Error('handler down');
      },
    });

    expect(() => client.track('clicked')).not.toThrow();
  });

  it('reports the phase of a failing identify', () => {
    const boom = new Error('identify down');
    const broken: AnalyticsProvider = {
      name: 'broken',
      identify: () => {
        throw boom;
      },
    };
    const onError = vi.fn();

    createAnalytics({ providers: [broken], onError }).identify('u_1');

    expect(onError).toHaveBeenCalledWith(boom, expect.objectContaining({ phase: AnalyticsFailurePhase.Identify }));
  });
});

describe('createAnalytics — buffering before a provider registers', () => {
  it('queues calls with no provider and replays them in order on register', () => {
    const client = createAnalytics({ now: at(5) });

    client.track('first');
    client.identify('u_1');
    client.page('/pricing');

    const sink = memoryAnalyticsProvider();
    client.register(sink);

    expect(sink.calls).toEqual([
      { kind: AnalyticsCallKind.Track, event: { name: 'first', timestamp: 5 } },
      { kind: AnalyticsCallKind.Identify, identity: { userId: 'u_1', timestamp: 5 } },
      { kind: AnalyticsCallKind.Page, event: { name: '/pricing', timestamp: 5 } },
    ]);
  });

  it('drains once — a later provider receives only what fires after it registers', () => {
    const client = createAnalytics();
    client.track('buffered');

    const first = memoryAnalyticsProvider();
    client.register(first);
    const second = memoryAnalyticsProvider();
    client.register(second);

    expect(second.calls).toEqual([]);

    client.track('live');

    expect(first.events.map((event) => event.name)).toEqual(['buffered', 'live']);
    expect(second.events.map((event) => event.name)).toEqual(['live']);
  });

  it('caps the buffer at maxQueueSize, dropping the oldest', () => {
    const client = createAnalytics({ maxQueueSize: 2 });

    client.track('one');
    client.track('two');
    client.track('three');

    const sink = memoryAnalyticsProvider();
    client.register(sink);

    expect(sink.events.map((event) => event.name)).toEqual(['two', 'three']);
  });

  it('maxQueueSize 0 buffers nothing', () => {
    const client = createAnalytics({ maxQueueSize: 0 });
    client.track('dropped');

    const sink = memoryAnalyticsProvider();
    client.register(sink);

    expect(sink.calls).toEqual([]);
  });

  it('resumes buffering once the last provider unregisters', () => {
    const client = createAnalytics();
    const sink = memoryAnalyticsProvider();
    const unregister = client.register(sink);

    unregister();
    client.track('after_unregister');

    expect(sink.calls).toEqual([]);

    const next = memoryAnalyticsProvider();
    client.register(next);

    expect(next.events.map((event) => event.name)).toEqual(['after_unregister']);
  });
});

describe('createAnalytics — flush', () => {
  it('awaits every provider flush', async () => {
    let slowDrained = false;
    const slow: AnalyticsProvider = {
      name: 'slow',
      flush: async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        slowDrained = true;
      },
    };
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [slow, sink] });

    await client.flush();

    expect(slowDrained).toBe(true);
    expect(sink.flushCount).toBe(1);
  });

  it('resolves when a provider implements no flush', async () => {
    const client = createAnalytics({ providers: [{ name: 'track-only', track: vi.fn() }] });

    await expect(client.flush()).resolves.toBeUndefined();
  });

  it('isolates a throwing flush and reports it under the flush phase', async () => {
    const boom = new Error('flush failed');
    const broken: AnalyticsProvider = {
      name: 'broken',
      flush: () => {
        throw boom;
      },
    };
    const onError = vi.fn();
    const client = createAnalytics({ providers: [broken], onError });

    await expect(client.flush()).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith(boom, expect.objectContaining({ phase: AnalyticsFailurePhase.Flush }));
  });

  it('isolates a rejected flush', async () => {
    const boom = new Error('flush rejected');
    const client = createAnalytics({ providers: [{ flush: () => Promise.reject(boom) }], onError: vi.fn() });

    await expect(client.flush()).resolves.toBeUndefined();
  });
});

describe('memoryAnalyticsProvider', () => {
  it('captures every call kind in its own view plus the ordered call log', () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink], now: at(7) });

    client.track('clicked');
    client.page('/home');
    client.identify('u_1');

    expect(sink.events).toEqual([{ name: 'clicked', timestamp: 7 }]);
    expect(sink.pages).toEqual([{ name: '/home', timestamp: 7 }]);
    expect(sink.identities).toEqual([{ userId: 'u_1', timestamp: 7 }]);
    expect(sink.calls).toHaveLength(3);
  });

  it('reset clears every capture', async () => {
    const sink = memoryAnalyticsProvider();
    const client = createAnalytics({ providers: [sink] });

    client.track('clicked');
    client.identify('u_1');
    client.page();
    await client.flush();

    expect(sink.flushCount).toBe(1);

    sink.reset();

    expect(sink.calls).toEqual([]);
    expect(sink.events).toEqual([]);
    expect(sink.pages).toEqual([]);
    expect(sink.identities).toEqual([]);
    expect(sink.flushCount).toBe(0);
  });
});

describe('consoleAnalyticsProvider', () => {
  it('logs each call kind through console.info with the default prefix', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const client = createAnalytics({ providers: [consoleAnalyticsProvider()], now: at(1) });

    client.track('clicked', { source: 'nav' });
    client.identify('u_1');
    client.page('/home');

    expect(info).toHaveBeenNthCalledWith(1, '[analytics] track', 'clicked', { source: 'nav' });
    expect(info).toHaveBeenNthCalledWith(2, '[analytics] identify', 'u_1', {});
    expect(info).toHaveBeenNthCalledWith(3, '[analytics] page', '/home', {});

    info.mockRestore();
  });

  it('honours a custom prefix', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    createAnalytics({ providers: [consoleAnalyticsProvider({ prefix: '[app]' })] }).track('clicked');

    expect(info).toHaveBeenCalledWith('[app] track', 'clicked', {});

    info.mockRestore();
  });
});

describe('default client', () => {
  it('the bare track helper reports on the default singleton', () => {
    const sink = memoryAnalyticsProvider();
    const unregister = analytics.register(sink);

    track('clicked', { source: 'nav' });

    expect(sink.events.map((event) => event.name)).toEqual(['clicked']);

    unregister();
  });

  it('a client created separately is isolated from the default singleton', () => {
    const own = memoryAnalyticsProvider();
    const shared = memoryAnalyticsProvider();
    const unregister = analytics.register(shared);
    const client = createAnalytics({ providers: [own] });

    client.track('scoped');

    expect(own.events.map((event) => event.name)).toEqual(['scoped']);
    expect(shared.calls).toEqual([]);

    unregister();
  });
});
