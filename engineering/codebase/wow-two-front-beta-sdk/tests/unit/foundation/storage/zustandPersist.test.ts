import { describe, expect, it, vi } from 'vitest';

import { memoryStorageBroker, namespacedBroker, type StorageBroker } from '@src/foundation/storage';
import { brokerPersistStorage } from '@src/foundation/storage/zustand';

// Node project — the adapter is pure logic (a broker → zustand `PersistStorage` bridge), so it is exercised
// directly against its three methods without spinning up a real zustand store or a DOM.

describe('brokerPersistStorage', () => {
  it('round-trips a StorageValue envelope through the broker', () => {
    const broker = memoryStorageBroker();
    const storage = brokerPersistStorage<{ count: number }>(broker);

    expect(storage.getItem('s')).toBeNull();

    storage.setItem('s', { state: { count: 3 }, version: 1 });

    expect(storage.getItem('s')).toEqual({ state: { count: 3 }, version: 1 });
    // Stored verbatim — the broker owns JSON; the adapter hands zustand the parsed envelope.
    expect(broker.read('s')).toEqual({ state: { count: 3 }, version: 1 });
  });

  it('removeItem clears the persisted value', () => {
    const broker = memoryStorageBroker();
    const storage = brokerPersistStorage(broker);
    storage.setItem('s', { state: 1 });

    storage.removeItem('s');

    expect(storage.getItem('s')).toBeNull();
  });

  it('composes with namespacedBroker so two stores stay isolated', () => {
    const backing = memoryStorageBroker();
    const a = brokerPersistStorage<string>(namespacedBroker(backing, 'a'));
    const b = brokerPersistStorage<string>(namespacedBroker(backing, 'b'));

    a.setItem('store', { state: 'A' });
    b.setItem('store', { state: 'B' });

    expect(a.getItem('store')).toEqual({ state: 'A' });
    expect(b.getItem('store')).toEqual({ state: 'B' });
    expect(backing.read('a:store')).toEqual({ state: 'A' });
    expect(backing.read('b:store')).toEqual({ state: 'B' });
  });

  it('returns null for an absent entry (zustand then uses the store initial state)', () => {
    expect(brokerPersistStorage(memoryStorageBroker()).getItem('missing')).toBeNull();
  });

  it('is a transparent delegate — failure-tolerance lives in the broker, not the adapter', () => {
    // The `StorageBroker` contract is never-throw (memory/local brokers swallow quota/parse errors → null), so
    // in practice `getItem` never throws. This asserts the adapter itself adds no swallowing of its own: a broker
    // that violates the contract surfaces straight through, keeping the seam thin and the broker authoritative.
    const throwingBroker: StorageBroker = {
      read: vi.fn(() => {
        throw new Error('blocked');
      }),
      write: vi.fn(),
      remove: vi.fn(),
    };
    expect(() => brokerPersistStorage(throwingBroker).getItem('s')).toThrow('blocked');
  });
});
