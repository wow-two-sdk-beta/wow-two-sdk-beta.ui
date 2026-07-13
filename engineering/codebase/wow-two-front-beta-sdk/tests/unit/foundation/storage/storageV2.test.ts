import { describe, expect, it, vi } from 'vitest';

import {
  createVersionedStore,
  memoryStorageBroker,
  namespacedBroker,
  type StorageBroker,
} from '@src/foundation/storage';

// Node project — no DOM needed; every case drives an in-memory broker (or a hand-rolled failing double), so the
// version/migration/namespace logic is exercised without `window` or `localStorage`.

describe('namespacedBroker', () => {
  it('prefixes keys so two namespaces over one store never collide', () => {
    const backing = memoryStorageBroker();
    const a = namespacedBroker(backing, 'a');
    const b = namespacedBroker(backing, 'b');

    a.write('draft', 1);
    b.write('draft', 2);

    expect(a.read('draft')).toBe(1);
    expect(b.read('draft')).toBe(2);
    // The physical keys are distinct on the shared backing store.
    expect(backing.read('a:draft')).toBe(1);
    expect(backing.read('b:draft')).toBe(2);
  });

  it('removes only its own namespaced key', () => {
    const backing = memoryStorageBroker();
    const a = namespacedBroker(backing, 'a');
    const b = namespacedBroker(backing, 'b');
    a.write('k', 'x');
    b.write('k', 'y');

    a.remove('k');

    expect(a.read('k')).toBeNull();
    expect(b.read('k')).toBe('y');
  });

  it('composes with another namespace (nested prefixes)', () => {
    const backing = memoryStorageBroker();
    const nested = namespacedBroker(namespacedBroker(backing, 'outer'), 'inner');
    nested.write('k', 42);
    expect(backing.read('outer:inner:k')).toBe(42);
  });
});

describe('createVersionedStore', () => {
  interface V3 {
    readonly fullName: string;
    readonly age: number;
  }

  /** A v1→v2→v3 chain: v1 `{name}` → v2 `{name, age}` → v3 `{fullName, age}`. */
  const migrations = {
    1: (old: unknown) => ({ ...(old as object), age: 0 }),
    2: (old: unknown) => {
      const { name, age } = old as { name: string; age: number };
      return { fullName: name, age };
    },
  };

  function store(broker: StorageBroker) {
    return createVersionedStore<V3>({ key: 'user', version: 3, initial: { fullName: '', age: 0 }, migrations, broker });
  }

  it('round-trips a current-version value through an envelope', () => {
    const broker = memoryStorageBroker();
    store(broker).write({ fullName: 'Ada', age: 36 });

    expect(store(broker).read()).toEqual({ fullName: 'Ada', age: 36 });
    // The persisted shape is a version envelope.
    expect(broker.read('user')).toEqual({ v: 3, data: { fullName: 'Ada', age: 36 } });
  });

  it('returns initial when nothing is stored', () => {
    expect(store(memoryStorageBroker()).read()).toEqual({ fullName: '', age: 0 });
  });

  it('migrates an older version up the chain and persists the upgrade', () => {
    const broker = memoryStorageBroker();
    broker.write('user', { v: 1, data: { name: 'Ada' } });

    expect(store(broker).read()).toEqual({ fullName: 'Ada', age: 0 });
    // Read wrote the upgraded envelope back, so a second read is migration-free.
    expect(broker.read('user')).toEqual({ v: 3, data: { fullName: 'Ada', age: 0 } });
  });

  it('treats a legacy bare value (no envelope) as version 0', () => {
    const broker = memoryStorageBroker();
    // Legacy write, pre-versioning: a raw value with no {v,data} wrapper.
    broker.write('legacy', { name: 'Bo' });
    const s = createVersionedStore({
      key: 'legacy',
      version: 2,
      initial: { name: '' },
      migrations: { 0: (old) => old, 1: (old) => ({ ...(old as object) }) },
      broker,
    });
    // v0 → v1 (identity) → v2 (spread) leaves the shape intact.
    expect(s.read()).toEqual({ name: 'Bo' });
  });

  it('falls back to initial when a migration step is missing', () => {
    const broker = memoryStorageBroker();
    broker.write('user', { v: 1, data: { name: 'Ada' } });
    const s = createVersionedStore<V3>({
      key: 'user',
      version: 3,
      initial: { fullName: 'fallback', age: -1 },
      migrations: { 2: migrations[2] }, // no migrations[1] → chain gap at v1
      broker,
    });
    expect(s.read()).toEqual({ fullName: 'fallback', age: -1 });
  });

  it('ignores a value written by newer code (higher version)', () => {
    const broker = memoryStorageBroker();
    broker.write('user', { v: 9, data: { future: true } });
    const s = store(broker);
    expect(s.read()).toEqual({ fullName: '', age: 0 });
    // The forward value is left untouched (not clobbered) so newer code still reads it.
    expect(broker.read('user')).toEqual({ v: 9, data: { future: true } });
  });

  it('degrades to initial when a migration throws', () => {
    const broker = memoryStorageBroker();
    broker.write('user', { v: 1, data: { name: 'Ada' } });
    const s = createVersionedStore<V3>({
      key: 'user',
      version: 2,
      initial: { fullName: 'safe', age: 0 },
      migrations: {
        1: () => {
          throw new Error('boom');
        },
      },
      broker,
    });
    expect(s.read()).toEqual({ fullName: 'safe', age: 0 });
  });

  it('degrades to initial when the broker read throws', () => {
    const throwingBroker: StorageBroker = {
      read: vi.fn(() => {
        throw new Error('read blew up');
      }),
      write: vi.fn(),
      remove: vi.fn(),
    };
    expect(store(throwingBroker).read()).toEqual({ fullName: '', age: 0 });
  });

  it('clear removes the stored value', () => {
    const broker = memoryStorageBroker();
    const s = store(broker);
    s.write({ fullName: 'Ada', age: 36 });
    s.clear();
    expect(broker.read('user')).toBeNull();
    expect(s.read()).toEqual({ fullName: '', age: 0 });
  });
});
