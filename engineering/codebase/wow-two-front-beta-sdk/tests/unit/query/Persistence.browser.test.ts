import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupQueryPersistence } from '@src/query/Persistence';

/** Builds an in-memory `localStorage` mock with spy-able methods. */
function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((index: number) => [...store.keys()][index] ?? null),
    get length() {
      return store.size;
    },
  } as unknown as Storage;
}

function setItemCalls(storage: Storage): unknown[][] {
  return (storage.setItem as unknown as ReturnType<typeof vi.fn>).mock.calls;
}

describe('setupQueryPersistence', () => {
  let storage: Storage;
  let originalDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    storage = createStorageMock();
    originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true, writable: true });
  });

  afterEach(() => {
    if (originalDescriptor) Object.defineProperty(window, 'localStorage', originalDescriptor);
    vi.useRealTimers();
  });

  it('returns a handle exposing unsubscribe + restored without throwing', () => {
    const client = new QueryClient();
    const handle = setupQueryPersistence(client, { storageKey: 'test:cache' });

    expect(handle).not.toBeNull();
    expect(typeof handle?.unsubscribe).toBe('function');
    expect(handle?.restored).toBeInstanceOf(Promise);

    handle?.unsubscribe();
    client.clear();
  });

  it('writes the cache to storage on a cache change', async () => {
    const client = new QueryClient();
    const handle = setupQueryPersistence(client, { storageKey: 'test:cache' });
    await handle?.restored; // subscription becomes active only after restore

    vi.useFakeTimers();
    client.setQueryData(['thing'], { value: 1 });
    await vi.advanceTimersByTimeAsync(1100); // past the persister's 1s throttle

    expect(storage.setItem).toHaveBeenCalled();
    expect(setItemCalls(storage).map((call) => call[0])).toContain('test:cache');

    handle?.unsubscribe();
  });

  it('defaults the storage key to app:query-cache', async () => {
    const client = new QueryClient();
    const handle = setupQueryPersistence(client);
    await handle?.restored;

    vi.useFakeTimers();
    client.setQueryData(['thing'], { value: 2 });
    await vi.advanceTimersByTimeAsync(1100);

    expect(setItemCalls(storage).map((call) => call[0])).toContain('app:query-cache');

    handle?.unsubscribe();
  });
});
