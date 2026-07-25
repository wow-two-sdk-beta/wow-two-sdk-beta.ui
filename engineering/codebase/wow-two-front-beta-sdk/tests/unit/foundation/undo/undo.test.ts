import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSnapshotHistory,
  createUndoHistory,
  HistoryPhase,
  type UndoableAction,
} from '@src/foundation/undo';

// Node project — the history engine is pure state, no DOM. The hooks live in `undo.browser.test.ts`.
//
// Time is injected (`now: () => clock`) rather than faked globally: coalescing is a WINDOW, and a test that
// asserts "merges at 50 ms, does not at 101 ms" has to move the clock by hand to mean anything.
//
// Most assertions read an effect log rather than `size`, because the question that matters is not how many
// entries exist but which work runs, in which order, when the user travels.

let clock = 0;

/** The injected clock every history in this file measures its coalescing window against. */
const now = (): number => clock;

beforeEach(() => {
  clock = 0;
});

/** An action that records its travel in `log` — the shape most tests assert on. */
function logged(log: string[], name: string, extra?: Partial<UndoableAction>): UndoableAction {
  return {
    label: name,
    do: () => log.push(`do:${name}`),
    undo: () => log.push(`undo:${name}`),
    ...extra,
  };
}

/** An action that travels without side effects — for tests that only care about the stack's shape. */
function inert(extra?: Partial<UndoableAction>): UndoableAction {
  return { do: () => undefined, undo: () => undefined, ...extra };
}

describe('createUndoHistory — travel', () => {
  it('round-trips a pushed action through undo and redo', () => {
    const model = { value: 0 };
    const history = createUndoHistory({ now });

    model.value = 1; // the change happens first; the history records how to take it back
    history.push({
      do: () => {
        model.value = 1;
      },
      undo: () => {
        model.value = 0;
      },
    });

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(history.size).toBe(1);

    expect(history.undo()).toBe(true);
    expect(model.value).toBe(0);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);

    expect(history.redo()).toBe(true);
    expect(model.value).toBe(1);
    expect(history.canRedo).toBe(false);
  });

  it('does not run `do` on push — the change is assumed already applied', () => {
    const apply = vi.fn();
    const history = createUndoHistory({ now });

    history.push({ do: apply, undo: () => undefined });

    expect(apply).not.toHaveBeenCalled();
  });

  it('reports false at both ends of an empty history', () => {
    const history = createUndoHistory({ now });

    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it('unwinds a multi-entry stack newest-first', () => {
    const log: string[] = [];
    const history = createUndoHistory({ now });

    history.push(logged(log, 'a'));
    history.push(logged(log, 'b'));
    history.push(logged(log, 'c'));
    log.length = 0;

    history.undo();
    history.undo();
    history.undo();

    expect(log).toEqual(['undo:c', 'undo:b', 'undo:a']);
    expect(history.undo()).toBe(false);
  });

  it('exposes the labels an "Undo {label}" menu item renders', () => {
    const history = createUndoHistory({ now });

    history.push(inert({ label: 'First' }));
    history.push(inert({ label: 'Second' }));
    expect(history.undoLabel).toBe('Second');
    expect(history.redoLabel).toBeUndefined();

    history.undo();
    expect(history.undoLabel).toBe('First');
    expect(history.redoLabel).toBe('Second');
  });

  it('runs then records with `execute`, and records nothing when the action throws', () => {
    const log: string[] = [];
    const history = createUndoHistory({ now });

    history.execute(logged(log, 'a'));
    expect(log).toEqual(['do:a']);
    expect(history.size).toBe(1);

    history.undo();
    expect(log).toEqual(['do:a', 'undo:a']);

    expect(() =>
      history.execute({
        do: () => {
          throw new Error('boom');
        },
        undo: () => undefined,
      }),
    ).toThrow('boom');
    expect(history.size).toBe(1); // the failed action never entered the stack
  });
});

describe('createUndoHistory — redo branch', () => {
  it('truncates the redo branch when a new entry is pushed after an undo', () => {
    const log: string[] = [];
    const history = createUndoHistory({ now });

    history.push(logged(log, 'a'));
    history.push(logged(log, 'b'));

    history.undo(); // 'b' now sits on the redo branch
    expect(history.canRedo).toBe(true);
    expect(history.redoLabel).toBe('b');

    history.push(logged(log, 'c')); // the branch dies here

    expect(history.canRedo).toBe(false);
    expect(history.redo()).toBe(false);
    expect(history.size).toBe(2); // a + c; b is gone for good

    log.length = 0;
    history.undo();
    history.undo();

    expect(log).toEqual(['undo:c', 'undo:a']); // 'b' never reappears
    expect(history.canUndo).toBe(false);
  });

  it('truncates a multi-entry branch, not just the top of it', () => {
    const history = createUndoHistory({ now });

    history.push(inert({ label: 'a' }));
    history.push(inert({ label: 'b' }));
    history.push(inert({ label: 'c' }));
    history.undo();
    history.undo();
    expect(history.size).toBe(3);

    history.push(inert({ label: 'd' }));

    expect(history.size).toBe(2); // a + d — both b and c were discarded
    expect(history.canRedo).toBe(false);
  });
});

describe('createUndoHistory — limit', () => {
  it('caps depth at `limit`, discarding the OLDEST entry', () => {
    const log: string[] = [];
    const history = createUndoHistory({ limit: 2, now });

    history.push(logged(log, 'a'));
    history.push(logged(log, 'b'));
    history.push(logged(log, 'c'));
    log.length = 0;

    expect(history.size).toBe(2);

    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(false); // 'a' was evicted, so there is no third step

    expect(log).toEqual(['undo:c', 'undo:b']); // 'a' never runs
  });

  it('keeps the redo branch travelable after an eviction', () => {
    const history = createUndoHistory({ limit: 2, now });

    history.push(inert({ label: 'a' }));
    history.push(inert({ label: 'b' }));
    history.push(inert({ label: 'c' }));

    history.undo();
    expect(history.canRedo).toBe(true);
    expect(history.redoLabel).toBe('c');
    expect(history.undoLabel).toBe('b');
  });
});

describe('createUndoHistory — coalescing', () => {
  /** A keystroke-shaped action: same key, so consecutive ones inside the window collapse to one step. */
  function keystroke(text: { value: string }, next: string, previous: string): UndoableAction {
    return {
      label: 'Typing',
      coalesceKey: 'text',
      do: () => {
        text.value = next;
      },
      undo: () => {
        text.value = previous;
      },
    };
  }

  it('merges a same-keyed push landing inside the window, so a typed run is one step', () => {
    const text = { value: '' };
    const history = createUndoHistory({ coalesceMs: 100, now });

    text.value = 'h';
    history.push(keystroke(text, 'h', ''));
    clock = 40;
    text.value = 'hi';
    history.push(keystroke(text, 'hi', 'h'));
    clock = 80;
    text.value = 'hip';
    history.push(keystroke(text, 'hip', 'hi'));

    expect(history.size).toBe(1);

    history.undo();
    expect(text.value).toBe(''); // one undo jumps the whole run
    expect(history.canUndo).toBe(false);
  });

  it('does not merge a same-keyed push landing outside the window', () => {
    const text = { value: '' };
    const history = createUndoHistory({ coalesceMs: 100, now });

    history.push(keystroke(text, 'h', ''));
    clock = 101; // one millisecond past the window
    history.push(keystroke(text, 'hi', 'h'));

    expect(history.size).toBe(2);
  });

  it('does not merge pushes carrying different keys', () => {
    const history = createUndoHistory({ coalesceMs: 100, now });

    history.push(inert({ coalesceKey: 'title' }));
    clock = 10;
    history.push(inert({ coalesceKey: 'body' }));

    expect(history.size).toBe(2);
  });

  it('does not merge a push carrying no key', () => {
    const history = createUndoHistory({ coalesceMs: 100, now });

    history.push(inert());
    clock = 10;
    history.push(inert());

    expect(history.size).toBe(2);
  });

  it('replays a merged run forward in order and unwinds it in reverse', () => {
    const log: string[] = [];
    const history = createUndoHistory({ coalesceMs: 100, now });

    history.push(logged(log, '1', { coalesceKey: 'run' }));
    clock = 10;
    history.push(logged(log, '2', { coalesceKey: 'run' }));
    log.length = 0;

    history.undo();
    expect(log).toEqual(['undo:2', 'undo:1']);

    log.length = 0;
    history.redo();
    expect(log).toEqual(['do:1', 'do:2']);
  });

  it('breaks the run at an undo, so a later push cannot merge into a travelled entry', () => {
    const history = createUndoHistory({ coalesceMs: 1000, now });

    history.push(inert({ coalesceKey: 'text' }));
    clock = 10;
    history.push(inert({ coalesceKey: 'text' }));
    expect(history.size).toBe(1);

    history.undo();
    history.redo(); // back on top of the same entry, still well inside the window
    clock = 20;
    history.push(inert({ coalesceKey: 'text' }));

    expect(history.size).toBe(2); // travelling ended the run
  });

  it('keeps the first label of a merged run', () => {
    const history = createUndoHistory({ coalesceMs: 100, now });

    history.push(inert({ label: 'Typing', coalesceKey: 'text' }));
    clock = 10;
    history.push(inert({ label: 'Typing more', coalesceKey: 'text' }));

    expect(history.undoLabel).toBe('Typing');
  });
});

describe('createUndoHistory — transactions', () => {
  it('groups every push inside the body into ONE reversible entry', () => {
    const log: string[] = [];
    const history = createUndoHistory({ now });

    history.transact('Move rows', () => {
      history.push(logged(log, 'a'));
      history.push(logged(log, 'b'));
      history.push(logged(log, 'c'));
    });

    expect(history.size).toBe(1);
    expect(history.undoLabel).toBe('Move rows');

    log.length = 0;
    history.undo();
    expect(log).toEqual(['undo:c', 'undo:b', 'undo:a']);
    expect(history.canUndo).toBe(false);

    log.length = 0;
    history.redo();
    expect(log).toEqual(['do:a', 'do:b', 'do:c']);
  });

  it('flattens a nested transaction into the outermost entry', () => {
    const log: string[] = [];
    const history = createUndoHistory({ now });

    history.transact('Outer', () => {
      history.push(logged(log, 'a'));
      history.transact('Inner', () => {
        history.push(logged(log, 'b'));
        history.push(logged(log, 'c'));
      });
      history.push(logged(log, 'd'));
    });

    expect(history.size).toBe(1);
    expect(history.undoLabel).toBe('Outer'); // the inner label is a structural detail, not a user intent

    log.length = 0;
    history.undo();
    expect(log).toEqual(['undo:d', 'undo:c', 'undo:b', 'undo:a']);
  });

  it('returns the body result', () => {
    const history = createUndoHistory({ now });

    expect(history.transact('Compute', () => 42)).toBe(42);
  });

  it('records nothing for a body that pushes nothing', () => {
    const history = createUndoHistory({ now });
    const listener = vi.fn();
    history.subscribe(listener);

    history.transact('Nothing', () => undefined);

    expect(history.size).toBe(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it('commits what a throwing body already pushed, then rethrows', () => {
    const log: string[] = [];
    const history = createUndoHistory({ now });

    expect(() =>
      history.transact('Partial', () => {
        history.push(logged(log, 'a'));
        throw new Error('boom');
      }),
    ).toThrow('boom');

    // The mutation already landed in the world — discarding it would make it unreachable by undo.
    expect(history.size).toBe(1);
    history.undo();
    expect(log).toEqual(['undo:a']);
  });

  it('truncates the redo branch like any other entry', () => {
    const history = createUndoHistory({ now });

    history.push(inert({ label: 'a' }));
    history.push(inert({ label: 'b' }));
    history.undo();

    history.transact('Group', () => {
      history.push(inert());
      history.push(inert());
    });

    expect(history.size).toBe(2); // a + the group; b was truncated
    expect(history.canRedo).toBe(false);
  });
});

describe('createUndoHistory — notification', () => {
  it('fires on push, undo, redo and clear, and stops after unsubscribe', () => {
    const listener = vi.fn();
    const history = createUndoHistory({ now });
    const unsubscribe = history.subscribe(listener);

    history.push(inert());
    history.undo();
    history.redo();
    history.clear();
    expect(listener).toHaveBeenCalledTimes(4);

    unsubscribe();
    history.push(inert());
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('bumps the version on every change', () => {
    const history = createUndoHistory({ now });
    const start = history.version();

    history.push(inert());
    history.undo();

    expect(history.version()).toBe(start + 2);
  });

  it('does not notify for a failed undo', () => {
    const listener = vi.fn();
    const history = createUndoHistory({ onError: () => undefined, now });
    history.push({
      do: () => undefined,
      undo: () => {
        throw new Error('nope');
      },
    });
    history.subscribe(listener);

    history.undo();

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('createUndoHistory — failure', () => {
  it('leaves the cursor where it was when an undo throws, and reports to onError', () => {
    const onError = vi.fn();
    const history = createUndoHistory({ onError, now });

    history.push(inert({ label: 'ok' }));
    history.push({
      label: 'bad',
      do: () => undefined,
      undo: () => {
        throw new Error('nope');
      },
    });

    expect(history.undo()).toBe(false);

    // Nothing moved: the failed entry is still the one to undo, and no phantom redo appeared.
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(history.size).toBe(2);
    expect(history.undoLabel).toBe('bad');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), HistoryPhase.Undo);
  });

  it('leaves the stack usable after a failed undo', () => {
    const log: string[] = [];
    const history = createUndoHistory({ onError: () => undefined, now });
    let broken = true;

    history.push(logged(log, 'a'));
    history.push({
      label: 'b',
      do: () => log.push('do:b'),
      undo: () => {
        if (broken) throw new Error('nope');
        log.push('undo:b');
      },
    });

    expect(history.undo()).toBe(false);
    broken = false; // the cause is fixed; the same entry is retried
    log.length = 0;

    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(true);
    expect(log).toEqual(['undo:b', 'undo:a']);
  });

  it('leaves the cursor where it was when a redo throws, and reports to onError', () => {
    const onError = vi.fn();
    const history = createUndoHistory({ onError, now });
    let broken = false;

    history.push({
      label: 'a',
      do: () => {
        if (broken) throw new Error('nope');
      },
      undo: () => undefined,
    });
    history.undo();
    broken = true;

    expect(history.redo()).toBe(false);
    expect(history.canRedo).toBe(true); // still on the branch, not half-applied
    expect(history.canUndo).toBe(false);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), HistoryPhase.Redo);
  });

  it('swallows a failure when no onError is supplied', () => {
    const history = createUndoHistory({ now });
    history.push({
      do: () => undefined,
      undo: () => {
        throw new Error('nope');
      },
    });

    expect(() => history.undo()).not.toThrow();
    expect(history.canUndo).toBe(true);
  });
});

describe('createUndoHistory — clear', () => {
  it('resets both flags and forgets every entry', () => {
    const history = createUndoHistory({ now });

    history.push(inert({ label: 'a' }));
    history.push(inert({ label: 'b' }));
    history.undo();
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(true);

    history.clear();

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.size).toBe(0);
    expect(history.undoLabel).toBeUndefined();
    expect(history.redoLabel).toBeUndefined();
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
  });

  it('ends a coalescing run', () => {
    const history = createUndoHistory({ coalesceMs: 1000, now });

    history.push(inert({ coalesceKey: 'text' }));
    history.clear();
    clock = 10;
    history.push(inert({ coalesceKey: 'text' }));
    clock = 20;
    history.push(inert({ coalesceKey: 'text' }));

    expect(history.size).toBe(1); // the run restarted after the clear, then merged normally
  });
});

describe('createSnapshotHistory', () => {
  it('round-trips `present` through undo and redo', () => {
    const history = createSnapshotHistory('a', { now });

    history.record('b');
    expect(history.present).toBe('b');
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);

    expect(history.undo()).toBe(true);
    expect(history.present).toBe('a');

    expect(history.redo()).toBe(true);
    expect(history.present).toBe('b');
  });

  it('walks a longer stack in both directions', () => {
    const history = createSnapshotHistory(0, { now });

    history.record(1);
    history.record(2);
    history.record(3);

    history.undo();
    history.undo();
    expect(history.present).toBe(1);

    history.redo();
    expect(history.present).toBe(2);
  });

  it('truncates the redo branch when a new state is recorded after an undo', () => {
    const history = createSnapshotHistory(0, { now });

    history.record(1);
    history.record(2);
    history.undo();
    expect(history.present).toBe(1);
    expect(history.canRedo).toBe(true);

    history.record(9); // the branch dies here

    expect(history.canRedo).toBe(false);
    expect(history.redo()).toBe(false);
    expect(history.present).toBe(9);
    expect(history.size).toBe(2);

    history.undo();
    expect(history.present).toBe(1);
    history.undo();
    expect(history.present).toBe(0); // state 2 is unreachable
    expect(history.canUndo).toBe(false);
  });

  it('caps depth at `limit`, discarding the OLDEST entry', () => {
    const history = createSnapshotHistory(0, { limit: 2, now });

    history.record(1);
    history.record(2);
    history.record(3);

    expect(history.size).toBe(2);

    history.undo();
    expect(history.present).toBe(2);
    history.undo();
    expect(history.present).toBe(1);

    expect(history.undo()).toBe(false);
    expect(history.present).toBe(1); // state 0 was evicted with its entry
  });

  it('merges same-keyed records inside the window and jumps the whole run on undo', () => {
    const history = createSnapshotHistory('', { coalesceMs: 100, now });

    history.record('h', { label: 'Typing', coalesceKey: 'text' });
    clock = 40;
    history.record('hi', { coalesceKey: 'text' });
    clock = 80;
    history.record('hip', { coalesceKey: 'text' });

    expect(history.size).toBe(1);
    expect(history.present).toBe('hip');
    expect(history.undoLabel).toBe('Typing');

    history.undo();
    expect(history.present).toBe('');
  });

  it('does not merge outside the window, nor across a different key', () => {
    const outside = createSnapshotHistory('', { coalesceMs: 100, now });
    outside.record('a', { coalesceKey: 'text' });
    clock = 101;
    outside.record('ab', { coalesceKey: 'text' });
    expect(outside.size).toBe(2);

    clock = 0;
    const other = createSnapshotHistory('', { coalesceMs: 100, now });
    other.record('a', { coalesceKey: 'title' });
    clock = 10;
    other.record('ab', { coalesceKey: 'body' });
    expect(other.size).toBe(2);
  });

  it('groups records inside `transact` into one entry, flattening nested calls', () => {
    const history = createSnapshotHistory(0, { now });

    history.transact('Bulk', () => {
      history.record(1);
      history.transact('Inner', () => {
        history.record(2);
        history.record(3);
      });
      history.record(4);
    });

    expect(history.size).toBe(1);
    expect(history.undoLabel).toBe('Bulk');
    expect(history.present).toBe(4);

    history.undo();
    expect(history.present).toBe(0); // one step back over the whole group

    history.redo();
    expect(history.present).toBe(4);
  });

  it('ignores a record of the state already held', () => {
    const state = { value: 1 };
    const history = createSnapshotHistory(state, { now });

    history.record(state);

    expect(history.size).toBe(0);
    expect(history.canUndo).toBe(false);
  });

  it('notifies subscribers and bumps the version', () => {
    const listener = vi.fn();
    const history = createSnapshotHistory(0, { now });
    const unsubscribe = history.subscribe(listener);

    history.record(1);
    history.undo();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    history.record(2);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('clear resets both flags and keeps the present state', () => {
    const history = createSnapshotHistory(0, { now });

    history.record(1);
    history.record(2);
    history.undo();
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(true);

    history.clear();

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.size).toBe(0);
    expect(history.present).toBe(1); // clear forgets history, it does not revert state
  });
});
