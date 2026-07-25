import { afterEach, describe, expect, it } from 'vitest';

import {
  createKeyValueStore,
  deleteDatabase,
  isIndexedDbAvailable,
  iterate,
  openDatabase,
  probeIndexedDb,
  requestToPromise,
  withTransaction,
} from '@src/foundation/idb';

// Browser project — chromium has a REAL IndexedDB; node has none at all, so essentially every meaningful
// assertion about this slice has to live here. A fake-indexeddb shim would only prove the slice calls the
// methods the shim implements, while the behaviours worth testing are precisely the ones a shim gets wrong:
// when a transaction actually commits, what `blocked` does to a pending upgrade, and which values survive a
// structured clone.
//
// ISOLATION IS BY DATABASE NAME, NOT BY CLEANUP ALONE. IndexedDB is origin-scoped and outlives the page, so
// two tests sharing a name would share state across runs — including a half-upgraded schema from a test that
// failed. Every test takes a fresh unique name from `uniqueName()`, and `afterEach` closes every connection
// it handed out before deleting: an open connection BLOCKS a delete, so closing first is what keeps teardown
// from timing out rather than being tidiness.

/** Distinguishes databases within a run; the timestamp additionally separates runs. */
let sequence = 0;

/** Databases to delete after the test. */
const createdNames: string[] = [];

/** Raw connections opened directly (bypassing `openDatabase`), which therefore have no auto-close handler. */
const rawConnections: IDBDatabase[] = [];

/** Connections and stores handed out by the slice, closed before teardown deletes their databases. */
const closeables: { close(): void }[] = [];

/** Reserves a database name no other test uses, and registers it for teardown. */
function uniqueName(): string {
  sequence++;
  const name = `wow-two-idb-test-${String(Date.now())}-${String(sequence)}`;
  createdNames.push(name);
  return name;
}

/** Registers anything with a `close()` so teardown can release it before deleting. */
function track<T extends { close(): void }>(closeable: T): T {
  closeables.push(closeable);
  return closeable;
}

/** Yields to the event loop so pending microtasks (a store's deferred `close()`) land before teardown deletes. */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

afterEach(async () => {
  for (const closeable of closeables) closeable.close();
  for (const connection of rawConnections) connection.close();
  closeables.length = 0;
  rawConnections.length = 0;

  await flush();

  for (const name of createdNames) await deleteDatabase(name);
  createdNames.length = 0;
});

/** Reports whether a transaction is still live — `objectStore()` throws `InvalidStateError` once it has finished. */
function isTransactionUsable(transaction: IDBTransaction): boolean {
  try {
    transaction.objectStore('items');
    return true;
  } catch {
    return false;
  }
}

/** Opens a database with one object store at `version`, the shape most tests need. */
function openWithStore(name: string, storeName: string, version = 1): Promise<IDBDatabase> {
  return openDatabase(name, {
    version,
    upgrade: (database) => {
      if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName);
    },
  }).then((database) => track(database));
}

describe('capability probes', () => {
  it('reports IndexedDB as available and functional in a real browser', async () => {
    expect(isIndexedDbAvailable()).toBe(true);
    await expect(probeIndexedDb()).resolves.toBe(true);
  });
});

describe('openDatabase', () => {
  it('creates object stores and indexes through upgrade, reporting version 0 for a new database', async () => {
    const name = uniqueName();
    const seen: { oldVersion: number; newVersion: number | null }[] = [];

    const database = track(
      await openDatabase(name, {
        version: 1,
        upgrade: (target, context) => {
          seen.push({ oldVersion: context.oldVersion, newVersion: context.newVersion });
          const items = target.createObjectStore('items');
          items.createIndex('byOwner', 'owner');
          target.createObjectStore('archive');
        },
      }),
    );

    expect(seen).toEqual([{ oldVersion: 0, newVersion: 1 }]);
    expect(database.version).toBe(1);
    expect([...database.objectStoreNames]).toEqual(['archive', 'items']);

    // The index exists on the store, not just the store on the database.
    const indexNames = await withTransaction(database, 'items', 'readonly', (transaction) => [
      ...transaction.objectStore('items').indexNames,
    ]);
    expect(indexNames).toEqual(['byOwner']);
  });

  it('does not run upgrade when reopening at the same version', async () => {
    const name = uniqueName();
    const first = track(await openWithStore(name, 'items'));
    first.close();

    let upgrades = 0;
    const second = track(
      await openDatabase(name, {
        version: 1,
        upgrade: () => {
          upgrades++;
        },
      }),
    );

    expect(upgrades).toBe(0);
    expect([...second.objectStoreNames]).toEqual(['items']);
  });

  it('rejects and leaves the schema untouched when upgrade throws', async () => {
    const name = uniqueName();

    const failure = await openDatabase(name, {
      version: 1,
      upgrade: (database) => {
        database.createObjectStore('items');
        throw new Error('migration exploded');
      },
    }).then(
      () => null,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe('migration exploded');

    // The version-change transaction was aborted, so the half-created store never committed: reopening sees
    // a database that still does not exist (version 0 -> 1 upgrade runs again).
    const versions: number[] = [];
    const reopened = track(
      await openDatabase(name, {
        version: 1,
        upgrade: (database, context) => {
          versions.push(context.oldVersion);
          database.createObjectStore('items');
        },
      }),
    );

    expect(versions).toEqual([0]);
    expect([...reopened.objectStoreNames]).toEqual(['items']);
  });

  it('yields its own connection on versionchange so another upgrade is never deadlocked', async () => {
    const name = uniqueName();
    let yielded = 0;

    // Held open deliberately — under a naive wrapper this connection is exactly what hangs the next upgrade.
    const first = track(
      await openDatabase(name, {
        version: 1,
        upgrade: (database) => {
          database.createObjectStore('items');
        },
        onVersionChange: () => {
          yielded++;
        },
      }),
    );
    expect(first.version).toBe(1);

    // Succeeds only because `first` closes itself when told another version is coming.
    const second = track(
      await openDatabase(name, {
        version: 2,
        upgrade: (database) => {
          database.createObjectStore('extra');
        },
      }),
    );

    expect(yielded).toBe(1);
    expect(second.version).toBe(2);
    expect([...second.objectStoreNames]).toEqual(['extra', 'items']);
  });

  it('rejects with a diagnostic error when a foreign connection blocks the upgrade', async () => {
    const name = uniqueName();
    const seeded = await openWithStore(name, 'items');
    seeded.close();
    await flush();

    // Opened raw, so it has none of this slice's auto-close courtesy — it just sits on the database, which
    // is what a second tab running an older deploy does.
    const squatter = await requestToPromise(indexedDB.open(name));
    rawConnections.push(squatter);

    let blockedCount = 0;
    const failure = await openDatabase(name, {
      version: 2,
      blockedTimeoutMs: 150,
      onBlocked: () => {
        blockedCount++;
      },
      upgrade: (database) => {
        database.createObjectStore('extra');
      },
    }).then(
      () => null,
      (error: unknown) => error,
    );

    expect(blockedCount).toBe(1);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain('blocked');
  });
});

describe('key/value store', () => {
  it('round-trips a plain value and reports a miss as undefined', async () => {
    const store = track(createKeyValueStore<string>({ databaseName: uniqueName() }));

    await store.set('greeting', 'salom');
    await expect(store.get('greeting')).resolves.toBe('salom');
    await expect(store.get('absent')).resolves.toBeUndefined();
  });

  it('round-trips structured-clone-only values that a JSON store would destroy', async () => {
    interface RichPayload {
      readonly blob: Blob;
      readonly bytes: Uint8Array;
      readonly lookup: Map<string, number>;
      readonly tags: Set<string>;
      readonly when: Date;
    }

    const store = track(createKeyValueStore<RichPayload>({ databaseName: uniqueName() }));
    const payload: RichPayload = {
      blob: new Blob(['tosh-kent'], { type: 'text/plain' }),
      bytes: new Uint8Array([0, 127, 255, 42]),
      lookup: new Map([
        ['a', 1],
        ['b', 2],
      ]),
      tags: new Set(['offline', 'draft']),
      when: new Date('2026-07-19T08:30:00.000Z'),
    };

    // THE CONTROL: prove a JSON-backed store (i.e. `foundation/storage`) genuinely cannot hold this value —
    // otherwise "structured clone" is an unverified claim about a value JSON might have handled anyway.
    const viaJson = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    expect(viaJson.blob).toEqual({}); // Blob has no JSON representation at all
    expect(viaJson.lookup).toEqual({}); // Map entries vanish
    expect(viaJson.tags).toEqual({}); // Set entries vanish
    expect(viaJson.bytes).not.toBeInstanceOf(Uint8Array); // becomes a plain index object
    expect(typeof viaJson.when).toBe('string'); // Date degrades to an ISO string

    await store.set('payload', payload);
    const restored = await store.get('payload');
    expect(restored).toBeDefined();
    if (restored === undefined) return;

    // THE PROOF: every value comes back with its type and contents intact.
    expect(restored.blob).toBeInstanceOf(Blob);
    expect(restored.blob.type).toBe('text/plain');
    await expect(restored.blob.text()).resolves.toBe('tosh-kent');

    expect(restored.bytes).toBeInstanceOf(Uint8Array);
    expect([...restored.bytes]).toEqual([0, 127, 255, 42]);

    expect(restored.lookup).toBeInstanceOf(Map);
    expect(restored.lookup.get('b')).toBe(2);

    expect(restored.tags).toBeInstanceOf(Set);
    expect(restored.tags.has('offline')).toBe(true);

    expect(restored.when).toBeInstanceOf(Date);
    expect(restored.when.getTime()).toBe(new Date('2026-07-19T08:30:00.000Z').getTime());
  });

  it('round-trips a cyclic graph, which JSON cannot serialize at all', async () => {
    interface Node {
      readonly id: string;
      self?: Node;
    }

    const store = track(createKeyValueStore<Node>({ databaseName: uniqueName() }));
    const node: Node = { id: 'root' };
    node.self = node;

    expect(() => JSON.stringify(node)).toThrow();

    await store.set('node', node);
    const restored = await store.get('node');
    expect(restored?.id).toBe('root');
    expect(restored?.self).toBe(restored); // the cycle survives as a cycle, not as a copy
  });

  it('reads and writes in bulk through getMany and setMany', async () => {
    const store = track(createKeyValueStore<number>({ databaseName: uniqueName() }));

    await store.setMany([
      ['one', 1],
      ['two', 2],
      ['three', 3],
    ]);

    await expect(store.getMany(['one', 'three', 'missing'])).resolves.toEqual([1, 3, undefined]);
    await expect(store.count()).resolves.toBe(3);
  });

  it('deletes, clears, and lists keys, values, and entries in key order', async () => {
    const store = track(createKeyValueStore<number>({ databaseName: uniqueName() }));
    await store.setMany([
      ['alpha', 1],
      ['beta', 2],
      ['gamma', 3],
      ['delta', 4],
    ]);

    await store.delete('beta');
    await expect(store.keys()).resolves.toEqual(['alpha', 'delta', 'gamma']);
    await expect(store.values()).resolves.toEqual([1, 4, 3]);
    await expect(store.entries()).resolves.toEqual([
      ['alpha', 1],
      ['delta', 4],
      ['gamma', 3],
    ]);

    await store.deleteMany(['alpha', 'gamma']);
    await expect(store.keys()).resolves.toEqual(['delta']);

    await store.clear();
    await expect(store.keys()).resolves.toEqual([]);
    await expect(store.count()).resolves.toBe(0);

    // Deleting a key that is not there is a success — the postcondition already holds.
    await expect(store.delete('never-existed')).resolves.toBeUndefined();
  });

  it('distinguishes a stored undefined from an absent key', async () => {
    const store = track(createKeyValueStore<number | undefined>({ databaseName: uniqueName() }));
    await store.set('stored', undefined);

    await expect(store.get('stored')).resolves.toBeUndefined();
    await expect(store.get('absent')).resolves.toBeUndefined();
    await expect(store.has('stored')).resolves.toBe(true);
    await expect(store.has('absent')).resolves.toBe(false);
  });

  it('rejects with an Error rather than throwing when a value cannot be cloned', async () => {
    const store = track(createKeyValueStore<unknown>({ databaseName: uniqueName() }));

    const failure = await store.set('fn', () => undefined).then(
      () => null,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    // The failed write rolled back; the store is still usable afterwards.
    await store.set('ok', 1);
    await expect(store.get('ok')).resolves.toBe(1);
  });

  it('re-opens transparently after close', async () => {
    const store = track(createKeyValueStore<string>({ databaseName: uniqueName() }));
    await store.set('key', 'value');

    store.close();

    await expect(store.get('key')).resolves.toBe('value');
  });

  it('keeps separate object stores in one database independent', async () => {
    const databaseName = uniqueName();
    const drafts = track(createKeyValueStore<string>({ databaseName, storeName: 'drafts' }));
    await drafts.set('shared-key', 'from-drafts');

    // Version 2, because adding a second store to an existing database is a schema change.
    const media = track(createKeyValueStore<string>({ databaseName, storeName: 'media', version: 2 }));
    await media.set('shared-key', 'from-media');

    await expect(media.get('shared-key')).resolves.toBe('from-media');
    // `drafts` yielded its connection to the v2 upgrade and re-opened underneath — its data is intact.
    await expect(drafts.get('shared-key')).resolves.toBe('from-drafts');
  });
});

describe('iterate', () => {
  it('visits every record with a cursor without materializing the store', async () => {
    const store = track(createKeyValueStore<number>({ databaseName: uniqueName() }));
    const entries: [string, number][] = Array.from({ length: 50 }, (_unused, index) => [
      `key-${String(index).padStart(2, '0')}`,
      index,
    ]);
    await store.setMany(entries);

    const visited: number[] = [];
    const count = await store.iterateEntries((entry) => {
      visited.push(entry.value);
    });

    expect(count).toBe(50);
    expect(visited).toHaveLength(50);
    expect(visited).toEqual(entries.map(([, value]) => value));
  });

  it('stops early when the visitor returns false', async () => {
    const store = track(createKeyValueStore<number>({ databaseName: uniqueName() }));
    await store.setMany([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
    ]);

    const visited: number[] = [];
    const count = await store.iterateEntries((entry) => {
      visited.push(entry.value);
      return entry.value !== 2;
    });

    expect(count).toBe(2);
    expect(visited).toEqual([1, 2]);
  });

  it('walks a raw object store inside a caller-owned transaction, honouring a key range', async () => {
    const name = uniqueName();
    const database = await openWithStore(name, 'items');

    await withTransaction(database, 'items', 'readwrite', (transaction) => {
      const store = transaction.objectStore('items');
      return Promise.all(
        ['a', 'b', 'c', 'd', 'e'].map((key, index) => requestToPromise(store.put(index, key))),
      );
    });

    const seen: string[] = [];
    const count = await withTransaction(database, 'items', 'readonly', (transaction) =>
      iterate<number, string>(
        transaction.objectStore('items'),
        (entry) => {
          seen.push(entry.key);
        },
        { query: IDBKeyRange.bound('b', 'd') },
      ),
    );

    expect(count).toBe(3);
    expect(seen).toEqual(['b', 'c', 'd']);
  });

  it('rejects when the visitor throws', async () => {
    const store = track(createKeyValueStore<number>({ databaseName: uniqueName() }));
    await store.setMany([
      ['a', 1],
      ['b', 2],
    ]);

    await expect(
      store.iterateEntries(() => {
        throw new Error('visitor exploded');
      }),
    ).rejects.toThrow('visitor exploded');
  });
});

describe('withTransaction', () => {
  it('resolves only after the transaction commits, not when the last request succeeds', async () => {
    const name = uniqueName();
    const database = await openWithStore(name, 'items');

    // Liveness is the observable difference between the two candidate resolution points: a transaction is
    // still usable when its last request succeeds, and permanently unusable once it has committed.
    //
    // (Asserting this with a second `complete` listener does NOT work, and the reason is worth recording:
    // `transactionToPromise` assigns `oncomplete` before the work runs, so it is listener #1. A listener the
    // test adds later is #2 — but the microtask checkpoint after #1 returns already drains the promise
    // continuation, so `withTransaction` resolves BETWEEN the two listeners. That is also the exact
    // mechanism that keeps a transaction alive across an `await` on an IDB request.)
    const capturedTransactions: IDBTransaction[] = [];
    let usableWhenRequestSucceeded = false;

    const result = await withTransaction(database, 'items', 'readwrite', async (transaction) => {
      capturedTransactions.push(transaction);
      await requestToPromise(transaction.objectStore('items').put('value', 'key'));
      usableWhenRequestSucceeded = isTransactionUsable(transaction);
      return 'done';
    });

    expect(result).toBe('done');
    expect(usableWhenRequestSucceeded).toBe(true); // the put's success did not end the transaction
    expect(capturedTransactions.map(isTransactionUsable)).toEqual([false]); // but resolution happened after it did

    // And the write is durable, read back through a fresh transaction.
    await expect(
      withTransaction(database, 'items', 'readonly', (transaction) =>
        requestToPromise(transaction.objectStore('items').get('key') as IDBRequest<string | undefined>),
      ),
    ).resolves.toBe('value');
  });

  it('rolls the whole transaction back when the work function fails', async () => {
    const name = uniqueName();
    const database = await openWithStore(name, 'items');

    await withTransaction(database, 'items', 'readwrite', (transaction) =>
      requestToPromise(transaction.objectStore('items').put('original', 'key')),
    );

    const failure = await withTransaction(database, 'items', 'readwrite', async (transaction) => {
      const store = transaction.objectStore('items');
      await requestToPromise(store.put('overwritten', 'key'));
      await requestToPromise(store.put('extra', 'second'));
      throw new Error('work exploded');
    }).then(
      () => null,
      (error: unknown) => error,
    );

    // The caller's error surfaces, not the AbortError the rollback produces.
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe('work exploded');

    const survivors = await withTransaction(database, 'items', 'readonly', (transaction) =>
      requestToPromise(transaction.objectStore('items').getAll() as IDBRequest<string[]>),
    );
    expect(survivors).toEqual(['original']); // neither write committed
  });

  it('rejects when the store does not exist instead of throwing synchronously', async () => {
    const name = uniqueName();
    const database = await openWithStore(name, 'items');

    await expect(withTransaction(database, 'nope', 'readonly', () => 1)).rejects.toBeInstanceOf(Error);
  });
});

describe('version migration', () => {
  it('migrates existing data from v1 to v2 inside the version-change transaction', async () => {
    const name = uniqueName();
    interface PersonV1 {
      readonly name: string;
    }
    interface PersonV2 extends PersonV1 {
      readonly displayName: string;
    }

    const v1 = track(createKeyValueStore<PersonV1>({ databaseName: name, storeName: 'people' }));
    await v1.setMany([
      ['1', { name: 'sultonbek' }],
      ['2', { name: 'boburbek' }],
    ]);
    v1.close();
    await flush();

    const transitions: { oldVersion: number; newVersion: number | null }[] = [];
    const v2 = track(
      await openDatabase(name, {
        version: 2,
        upgrade: (database, context) => {
          transitions.push({ oldVersion: context.oldVersion, newVersion: context.newVersion });

          if (context.oldVersion < 2) {
            database.createObjectStore('audit');

            // Data migration via a RAW cursor rather than `iterate`: rewriting records needs
            // `cursor.update()`, which the read-oriented visitor deliberately does not expose. The requests
            // keep the version-change transaction alive even though this handler returns immediately.
            const people = context.transaction.objectStore('people');
            const cursorRequest = people.openCursor();
            cursorRequest.onsuccess = () => {
              const cursor = cursorRequest.result;
              if (cursor === null) return;
              const person = cursor.value as PersonV1;
              cursor.update({ ...person, displayName: person.name.toUpperCase() } satisfies PersonV2);
              cursor.continue();
            };
          }
        },
      }),
    );

    expect(transitions).toEqual([{ oldVersion: 1, newVersion: 2 }]);
    expect(v2.version).toBe(2);
    expect([...v2.objectStoreNames]).toEqual(['audit', 'people']);
    v2.close();
    await flush();

    const migrated = track(createKeyValueStore<PersonV2>({ databaseName: name, storeName: 'people', version: 2 }));
    await expect(migrated.entries()).resolves.toEqual([
      ['1', { name: 'sultonbek', displayName: 'SULTONBEK' }],
      ['2', { name: 'boburbek', displayName: 'BOBURBEK' }],
    ]);
  });
});

describe('deleteDatabase', () => {
  it('removes the database and its contents', async () => {
    const name = uniqueName();
    const store = track(createKeyValueStore<string>({ databaseName: name }));
    await store.set('key', 'value');
    await expect(store.get('key')).resolves.toBe('value');

    store.close();
    await flush();
    await expect(deleteDatabase(name)).resolves.toBeUndefined();

    // Reopening sees a database that does not exist: the upgrade runs from version 0 and the data is gone.
    const versions: number[] = [];
    const reopened = track(
      await openDatabase(name, {
        version: 1,
        upgrade: (database, context) => {
          versions.push(context.oldVersion);
          database.createObjectStore('keyval');
        },
      }),
    );

    expect(versions).toEqual([0]);
    const remaining = await withTransaction(reopened, 'keyval', 'readonly', (transaction) =>
      requestToPromise(transaction.objectStore('keyval').count()),
    );
    expect(remaining).toBe(0);
  });

  it('succeeds when the database never existed', async () => {
    await expect(deleteDatabase(`${uniqueName()}-never-created`)).resolves.toBeUndefined();
  });
});
