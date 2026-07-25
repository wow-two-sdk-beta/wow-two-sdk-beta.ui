import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useUndoHistory,
  useUndoShortcuts,
  useUndoableState,
  type UndoableAction,
} from '@src/foundation/undo';

// Browser project (real DOM + window). The engine itself is covered in the node suite; what is asserted here is
// only the React seam — who owns the history, when a change re-renders, and that the chords really bind.
//
// Chords are parsed with `applePlatform: true` and events dispatched with `metaKey`, so ⌘Z matches regardless of
// the host OS (the idiom `tests/unit/foundation/shortcuts/useHotkeys.test.tsx` established). Events go out inside
// `act` so the listener — attached in an effect — is guaranteed installed first, and so the re-render flushes.

const APPLE = { applePlatform: true } as const;

afterEach(cleanup);

/** An action that travels without side effects — these tests assert on the stack, not on a model. */
const inert: UndoableAction = { do: () => undefined, undo: () => undefined };

/** Dispatches a keydown on `target` (default `window`), returning the event so callers can read `defaultPrevented`. */
function press(key: string, mods: KeyboardEventInit = {}, target: EventTarget = window): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe('useUndoHistory', () => {
  it('keeps one history across renders', () => {
    const { result, rerender } = renderHook(() => useUndoHistory());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('re-renders the component on every history change', () => {
    const rendered = vi.fn();
    const { result } = renderHook(() => {
      rendered();
      return useUndoHistory();
    });

    const beforePush = rendered.mock.calls.length;
    act(() => {
      result.current.push(inert);
    });
    expect(rendered.mock.calls.length).toBeGreaterThan(beforePush);

    const beforeUndo = rendered.mock.calls.length;
    act(() => {
      result.current.undo();
    });
    expect(rendered.mock.calls.length).toBeGreaterThan(beforeUndo);
  });

  it('reports fresh flags after a push, an undo, and a redo', () => {
    const { result } = renderHook(() => useUndoHistory());
    expect(result.current.canUndo).toBe(false);

    act(() => {
      result.current.push({ ...inert, label: 'Delete row' });
    });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.undoLabel).toBe('Delete row');

    act(() => {
      result.current.undo();
    });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(result.current.canRedo).toBe(false);
  });

  it('routes a failing undo to the latest onError closure', () => {
    const onError = vi.fn();
    const { result, rerender } = renderHook(
      (props: { onError: (error: unknown) => void }) => useUndoHistory(props),
      { initialProps: { onError: () => undefined } },
    );

    act(() => {
      result.current.push({
        do: () => undefined,
        undo: () => {
          throw new Error('nope');
        },
      });
    });
    rerender({ onError }); // a fresh closure, supplied after the history was created

    act(() => {
      result.current.undo();
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.canUndo).toBe(true);
  });

  it('stops listening after unmount', () => {
    const { result, unmount } = renderHook(() => useUndoHistory());
    const history = result.current;

    unmount();

    expect(() => history.push(inert)).not.toThrow();
  });
});

describe('useUndoableState', () => {
  it('round-trips state through undo and redo', () => {
    const { result } = renderHook(() => useUndoableState('a'));

    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
    expect(result.current[2].canUndo).toBe(true);

    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe('a');

    act(() => {
      result.current[2].redo();
    });
    expect(result.current[0]).toBe('b');
  });

  it('accepts an updater resolved against the live present', () => {
    const { result } = renderHook(() => useUndoableState('a'));

    act(() => result.current[1]((previous) => `${previous}b`));
    act(() => result.current[1]((previous) => `${previous}c`));

    expect(result.current[0]).toBe('abc');
    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe('ab');
  });

  it('truncates the redo branch when a new state is set after an undo', () => {
    const { result } = renderHook(() => useUndoableState(0));

    act(() => result.current[1](1));
    act(() => result.current[1](2));
    act(() => {
      result.current[2].undo();
    });
    expect(result.current[2].canRedo).toBe(true);

    act(() => result.current[1](9));

    expect(result.current[2].canRedo).toBe(false);
    expect(result.current[2].size).toBe(2);
  });

  it('coalesces same-keyed sets inside the window into one step', () => {
    let clock = 0;
    const { result } = renderHook(() =>
      useUndoableState('', { coalesceMs: 100, now: () => clock }),
    );

    act(() => result.current[1]('h', { label: 'Typing', coalesceKey: 'text' }));
    clock = 40;
    act(() => result.current[1]('hi', { coalesceKey: 'text' }));
    clock = 80;
    act(() => result.current[1]('hip', { coalesceKey: 'text' }));

    expect(result.current[0]).toBe('hip');
    expect(result.current[2].size).toBe(1);

    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe('');
  });

  it('groups sets made inside transact into one entry', () => {
    const { result } = renderHook(() => useUndoableState(0));

    act(() => {
      result.current[2].transact('Bulk', () => {
        result.current[1](1);
        result.current[1](2);
      });
    });

    expect(result.current[0]).toBe(2);
    expect(result.current[2].size).toBe(1);

    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe(0);
  });
});

describe('useUndoShortcuts', () => {
  /** Mounts a command history with the conventional chords bound, seeded with one undoable entry. */
  function renderBound(options?: Parameters<typeof useUndoShortcuts>[1]) {
    const bound = renderHook(() => {
      const history = useUndoHistory();
      useUndoShortcuts(history, { ...APPLE, ...options });
      return history;
    });
    act(() => {
      bound.result.current.push(inert);
    });
    return bound;
  }

  it('undoes on a real mod+z keydown', () => {
    const { result } = renderBound();
    expect(result.current.canUndo).toBe(true);

    const event = press('z', { metaKey: true });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('redoes on mod+shift+z', () => {
    const { result } = renderBound();
    press('z', { metaKey: true });

    press('z', { metaKey: true, shiftKey: true });

    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });

  it('redoes on mod+y — the Windows muscle memory', () => {
    const { result } = renderBound();
    press('z', { metaKey: true });

    press('y', { metaKey: true });

    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });

  it('leaves a bare z alone', () => {
    const { result } = renderBound();

    press('z');

    expect(result.current.canUndo).toBe(true);
  });

  it('binds nothing when disabled', () => {
    const { result } = renderBound({ enabled: false });

    press('z', { metaKey: true });

    expect(result.current.canUndo).toBe(true);
  });

  it('fires while a text field has focus, because the chord carries a modifier', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const { result } = renderBound();

    press('z', { metaKey: true }, input);

    expect(result.current.canUndo).toBe(false);
    input.remove();
  });

  it('honours custom chords', () => {
    const { result } = renderBound({ undoChords: 'mod+u', redoChords: ['mod+r'] });

    press('z', { metaKey: true });
    expect(result.current.canUndo).toBe(true); // the default chord no longer binds

    press('u', { metaKey: true });
    expect(result.current.canUndo).toBe(false);

    press('r', { metaKey: true });
    expect(result.current.canRedo).toBe(false);
  });

  it('drives a snapshot history too — the target is the shared four-member surface', () => {
    const { result } = renderHook(() => {
      const state = useUndoableState('a');
      useUndoShortcuts(state[2], APPLE);
      return state;
    });

    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');

    press('z', { metaKey: true });
    expect(result.current[0]).toBe('a');

    press('z', { metaKey: true, shiftKey: true });
    expect(result.current[0]).toBe('b');
  });

  it('unbinds on unmount', () => {
    const { result, unmount } = renderBound();
    const history = result.current;

    unmount();
    press('z', { metaKey: true });

    expect(history.canUndo).toBe(true);
  });
});
