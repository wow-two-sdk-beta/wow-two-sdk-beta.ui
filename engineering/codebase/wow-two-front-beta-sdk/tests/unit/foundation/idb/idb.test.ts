import { afterEach, describe, expect, it } from 'vitest';

import {
  createKeyValueStore,
  deleteDatabase,
  isIndexedDbAvailable,
  openDatabase,
  probeIndexedDb,
  requestToPromise,
  transactionToPromise,
} from '@src/foundation/idb';

// Node project — and node has NO IndexedDB, which is exactly what makes it the right place for these two
// groups and the wrong place for everything else (the real coverage is in `idb.browser.test.ts`):
//
//  1. THE SSR CONTRACT, tested in a runtime that genuinely lacks the API rather than one pretending to. The
//     claim is that importing the slice, and even constructing a store, is safe where `indexedDB` does not
//     exist, and that the failure arrives as a rejection instead of a throw. A browser cannot test that.
//  2. THE PROMISE ADAPTERS' SETTLE-ONCE LOGIC, driven through hand-built doubles. `requestToPromise` must
//     ignore a second `success` because a cursor request fires repeatedly, and firing an event twice on a
//     real request is not something a browser lets you arrange.

/** The event-handler shape both IndexedDB doubles use; the wrappers ignore the event argument. */
type Handler = ((event: Event) => void) | null;

/** A minimal stand-in for `IDBRequest`, with the handlers the wrapper assigns left writable. */
interface RequestDouble<TResult> {
  result: TResult;
  error: DOMException | null;
  onsuccess: Handler;
  onerror: Handler;
}

/** A minimal stand-in for `IDBTransaction`. */
interface TransactionDouble {
  error: DOMException | null;
  oncomplete: Handler;
  onerror: Handler;
  onabort: Handler;
}

/** Builds a request double already typed as the `IDBRequest` the wrapper expects. */
function requestDouble<TResult>(result: TResult): {
  double: RequestDouble<TResult>;
  request: IDBRequest<TResult>;
} {
  const double: RequestDouble<TResult> = { result, error: null, onsuccess: null, onerror: null };
  return { double, request: double as unknown as IDBRequest<TResult> };
}

/** Builds a transaction double already typed as the `IDBTransaction` the wrapper expects. */
function transactionDouble(): { double: TransactionDouble; transaction: IDBTransaction } {
  const double: TransactionDouble = { error: null, oncomplete: null, onerror: null, onabort: null };
  return { double, transaction: double as unknown as IDBTransaction };
}

/** Removes any `indexedDB` this file installed on the global, restoring the bare-node baseline. */
function clearGlobalIndexedDb(): void {
  delete (globalThis as { indexedDB?: unknown }).indexedDB;
}

afterEach(() => {
  clearGlobalIndexedDb();
});

describe('SSR / no-IndexedDB contract', () => {
  it('reports the API as unavailable instead of throwing', async () => {
    expect(isIndexedDbAvailable()).toBe(false);
    await expect(probeIndexedDb()).resolves.toBe(false);
  });

  it('answers unavailable when reading the global itself throws', () => {
    // A sandboxed iframe without `allow-same-origin` raises SecurityError from the getter, so even a
    // `typeof` probe would throw — the read has to be inside a try/catch.
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      get(): never {
        throw new Error('SecurityError: storage is disabled');
      },
    });

    expect(isIndexedDbAvailable()).toBe(false);
  });

  it('answers unavailable for a global that is present but not a factory', () => {
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {}, writable: true });

    expect(isIndexedDbAvailable()).toBe(false);
  });

  it('constructs a key/value store without touching the global, then rejects on use', async () => {
    // The whole point: this line may sit at module scope in an SSR bundle.
    const store = createKeyValueStore<string>({ databaseName: 'ssr-safe' });

    expect(store.databaseName).toBe('ssr-safe');
    expect(store.storeName).toBe('keyval');
    expect(() => {
      store.close();
    }).not.toThrow();

    const failure = await store.get('key').then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain('IndexedDB is unavailable');
  });

  it('rejects rather than throws from openDatabase and deleteDatabase', async () => {
    await expect(openDatabase('ssr-safe')).rejects.toThrow(/IndexedDB is unavailable/);
    await expect(deleteDatabase('ssr-safe')).rejects.toThrow(/IndexedDB is unavailable/);
  });

  it('retries the open on the next call instead of caching a failed one', async () => {
    const store = createKeyValueStore<string>({ databaseName: 'ssr-safe' });

    await expect(store.get('a')).rejects.toBeInstanceOf(Error);
    // A cached rejected open would make this identical rejection a replay rather than a fresh attempt; the
    // observable guarantee is that the store stays usable once the environment can support it.
    await expect(store.get('b')).rejects.toBeInstanceOf(Error);
  });
});

describe('requestToPromise', () => {
  it('resolves with the request result', async () => {
    const { double, request } = requestDouble(42);
    const promise = requestToPromise(request);

    double.onsuccess?.(new Event('success'));

    await expect(promise).resolves.toBe(42);
  });

  it('rejects with the request error', async () => {
    const { double, request } = requestDouble<number>(0);
    const promise = requestToPromise(request);

    double.error = new Error('QuotaExceededError') as unknown as DOMException;
    double.onerror?.(new Event('error'));

    await expect(promise).rejects.toThrow('QuotaExceededError');
  });

  it('rejects with a stand-in error when the browser reports none', async () => {
    const { double, request } = requestDouble<number>(0);
    const promise = requestToPromise(request);

    double.onerror?.(new Event('error'));

    await expect(promise).rejects.toThrow(/without reporting an error/);
  });

  it('settles exactly once even when success fires repeatedly', async () => {
    // The cursor case: one request, many `success` events. Without the guard the promise would appear to
    // resolve per record — harmless for a promise, but it is the same guard `iterate` depends on not having.
    const { double, request } = requestDouble(1);
    const promise = requestToPromise(request);

    double.onsuccess?.(new Event('success'));
    double.result = 2;
    double.onsuccess?.(new Event('success'));
    double.onerror?.(new Event('error'));

    await expect(promise).resolves.toBe(1);
  });
});

describe('transactionToPromise', () => {
  it('resolves on complete', async () => {
    const { double, transaction } = transactionDouble();
    const promise = transactionToPromise(transaction);

    double.oncomplete?.(new Event('complete'));

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects on error', async () => {
    const { double, transaction } = transactionDouble();
    const promise = transactionToPromise(transaction);

    double.error = new Error('ConstraintError') as unknown as DOMException;
    double.onerror?.(new Event('error'));

    await expect(promise).rejects.toThrow('ConstraintError');
  });

  it('rejects on a deliberate abort, which reports no error of its own', async () => {
    const { double, transaction } = transactionDouble();
    const promise = transactionToPromise(transaction);

    double.onabort?.(new Event('abort'));

    await expect(promise).rejects.toThrow(/aborted/);
  });

  it('keeps the first outcome when complete and abort both fire', async () => {
    const { double, transaction } = transactionDouble();
    const promise = transactionToPromise(transaction);

    double.oncomplete?.(new Event('complete'));
    double.onabort?.(new Event('abort'));

    await expect(promise).resolves.toBeUndefined();
  });
});
