import { afterEach, describe, expect, it, vi } from 'vitest';

import { Guid } from '@src/foundation/identifiers';
import { createLeaderElection, createSyncChannel, memorySyncHub, type LeaderSignal } from '@src/foundation/sync';

// Node project. Cross-tab behavior is exercised through `memorySyncHub` — the slice's own in-memory double —
// because the real `BroadcastChannel` delivers on the event loop, which races `vi.useFakeTimers` and would make
// the election tests flaky. Transport *resolution* is asserted separately against the real environment.

afterEach(() => {
  vi.useRealTimers();
});

/** Builds a pinned v7 GUID from a fixed byte pattern so id ordering (and therefore tie-breaks) is deterministic. */
function pinnedId(suffix: string): Guid {
  // The final GUID group is exactly 12 hex characters — pad rather than concatenate.
  return Guid.parse(`00000000-0000-7000-8000-${suffix.padStart(12, '0')}`);
}

describe('memorySyncHub channels', () => {
  it('delivers a message to another endpoint on the same name', () => {
    const hub = memorySyncHub();
    const a = hub.channel<{ kind: string }>('room');
    const b = hub.channel<{ kind: string }>('room');
    const heard = vi.fn();
    b.subscribe(heard);

    a.post({ kind: 'ping' });

    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard.mock.calls[0]?.[0]).toEqual({ kind: 'ping' });
  });

  it('never delivers a message back to its sender', () => {
    const hub = memorySyncHub();
    const a = hub.channel<string>('room');
    const own = vi.fn();
    a.subscribe(own);

    a.post('hello');

    expect(own).not.toHaveBeenCalled();
  });

  it('isolates endpoints on different channel names', () => {
    const hub = memorySyncHub();
    const listener = vi.fn();
    hub.channel<string>('other').subscribe(listener);

    hub.channel<string>('room').post('hello');

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops delivering after close, and close is idempotent', () => {
    const hub = memorySyncHub();
    const a = hub.channel<string>('room');
    const b = hub.channel<string>('room');
    const heard = vi.fn();
    b.subscribe(heard);

    b.close();
    b.close();
    a.post('hello');

    expect(heard).not.toHaveBeenCalled();
    expect(b.closed).toBe(true);
  });

  it('unsubscribes via the returned disposer', () => {
    const hub = memorySyncHub();
    const a = hub.channel<string>('room');
    const b = hub.channel<string>('room');
    const heard = vi.fn();

    const dispose = b.subscribe(heard);
    dispose();
    dispose(); // idempotent
    a.post('hello');

    expect(heard).not.toHaveBeenCalled();
  });

  it('absorbs a listener that throws without breaking other listeners', () => {
    const hub = memorySyncHub();
    const a = hub.channel<string>('room');
    const b = hub.channel<string>('room');
    const good = vi.fn();
    b.subscribe(() => {
      throw new Error('listener blew up');
    });
    b.subscribe(good);

    expect(() => a.post('hello')).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });

  it('tracks open endpoints and clears them on reset', () => {
    const hub = memorySyncHub();
    hub.channel('room');
    hub.channel('room');
    expect(hub.openCount).toBe(2);

    hub.reset();

    expect(hub.openCount).toBe(0);
  });
});

describe('createSyncChannel transport resolution', () => {
  it('resolves to inert when explicitly requested, and stays silent', () => {
    const channel = createSyncChannel<string>('room', { transport: 'inert' });
    const heard = vi.fn();
    channel.subscribe(heard);

    expect(channel.transport).toBe('inert');
    expect(() => channel.post('hello')).not.toThrow();
    expect(heard).not.toHaveBeenCalled();
    channel.close();
  });

  it('exposes a stable id and the channel name', () => {
    const id = pinnedId('000001');
    const channel = createSyncChannel<string>('room', { transport: 'inert', id });

    expect(channel.name).toBe('room');
    expect(channel.id).toBe(id);
    channel.close();
  });

  it('posting and subscribing after close are inert, not errors', () => {
    const channel = createSyncChannel<string>('room', { transport: 'inert' });
    channel.close();

    expect(() => channel.post('hello')).not.toThrow();
    expect(() => channel.subscribe(() => {})()).not.toThrow();
    expect(channel.closed).toBe(true);
  });
});

describe('leader election', () => {
  /** Timing small enough to advance quickly, wide enough that the phases stay distinct. */
  const TIMING = { heartbeatInterval: 100, timeout: 500, claimWindow: 50 } as const;

  it('makes the sole participant the leader', () => {
    vi.useFakeTimers();
    const hub = memorySyncHub();
    const election = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job'), ...TIMING });

    vi.advanceTimersByTime(TIMING.claimWindow + 10);

    expect(election.isLeader).toBe(true);
    expect(election.role).toBe('leader');
    election.close();
  });

  it('elects exactly one leader among three participants, lowest id winning', () => {
    vi.useFakeTimers();
    const hub = memorySyncHub();
    const low = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job', pinnedId('000001')), ...TIMING });
    const mid = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job', pinnedId('000002')), ...TIMING });
    const high = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job', pinnedId('000003')), ...TIMING });

    vi.advanceTimersByTime(TIMING.claimWindow + 10);

    const leaders = [low, mid, high].filter((e) => e.isLeader);
    expect(leaders).toHaveLength(1);
    expect(low.isLeader).toBe(true);

    low.close();
    mid.close();
    high.close();
  });

  it('fires onBecomeLeader immediately for a late subscriber that already leads', () => {
    vi.useFakeTimers();
    const hub = memorySyncHub();
    const election = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job'), ...TIMING });
    vi.advanceTimersByTime(TIMING.claimWindow + 10);

    const became = vi.fn();
    election.onBecomeLeader(became);

    expect(became).toHaveBeenCalledTimes(1);
    election.close();
  });

  it('reclaims leadership after a crashed leader stops heartbeating', () => {
    vi.useFakeTimers();
    const hub = memorySyncHub();
    const leaderChannel = hub.channel<LeaderSignal>('job', pinnedId('000001'));
    const leader = createLeaderElection('job', { channel: leaderChannel, ...TIMING });
    const follower = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job', pinnedId('000002')), ...TIMING });

    vi.advanceTimersByTime(TIMING.claimWindow + 10);
    expect(leader.isLeader).toBe(true);
    expect(follower.isLeader).toBe(false);

    // Simulate a crash: the tab vanishes without resigning, so its heartbeats simply stop arriving.
    leaderChannel.close();
    vi.advanceTimersByTime(TIMING.timeout + TIMING.claimWindow + 50);

    expect(follower.isLeader).toBe(true);
    follower.close();
    leader.close();
  });

  it('hands leadership over on release', () => {
    vi.useFakeTimers();
    const hub = memorySyncHub();
    const first = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job', pinnedId('000001')), ...TIMING });
    const second = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job', pinnedId('000002')), ...TIMING });
    vi.advanceTimersByTime(TIMING.claimWindow + 10);
    expect(first.isLeader).toBe(true);

    const lost = vi.fn();
    first.onLoseLeader(lost);
    first.release();

    expect(first.isLeader).toBe(false);
    expect(lost).toHaveBeenCalledTimes(1);

    // `release` tells peers to re-elect at once, so the handover lands within a claim window. Advancing past
    // `timeout` would be wrong here: the released tab stays in the election and, holding the lowest id, would
    // legitimately win it back.
    vi.advanceTimersByTime(TIMING.claimWindow + 10);
    expect(second.isLeader).toBe(true);

    first.close();
    second.close();
  });

  it('close is idempotent and does not throw', () => {
    vi.useFakeTimers();
    const hub = memorySyncHub();
    const election = createLeaderElection('job', { channel: hub.channel<LeaderSignal>('job'), ...TIMING });
    vi.advanceTimersByTime(TIMING.claimWindow + 10);

    expect(() => {
      election.close();
      election.close();
    }).not.toThrow();
  });

  it('runs without a transport — the sole participant leads under SSR', () => {
    vi.useFakeTimers();
    const election = createLeaderElection('job', { channelOptions: { transport: 'inert' }, ...TIMING });

    vi.advanceTimersByTime(TIMING.claimWindow + 10);

    expect(election.isLeader).toBe(true);
    election.close();
  });
});
