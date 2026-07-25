import { describe, expect, it } from 'vitest';

import {
  clear,
  createSelection,
  deselect,
  extendSelection,
  invert,
  isSelected,
  select,
  selectAll,
  selectRange,
  selectedKeys,
  selectionCount,
  selectionStatus,
  toggle,
  toggleAll,
  SelectionMode,
  SelectionStatus,
  type SelectionKey,
  type SelectionState,
} from '@src/foundation/selection';

// Node project — the selection model is pure state, no DOM and no React. The invariants worth pinning are
// the ones a component would otherwise re-decide per surface: what each mode allows, where the anchor sits
// after each op, and whether a no-op is observable.

/** The visual order a surface would hand the range ops — rows as the user currently sees them. */
const ROWS = ['a', 'b', 'c', 'd', 'e'] as const;

/** Reads a state's keys as a plain array — the shape most assertions want. */
function keysOf<TKey extends SelectionKey>(state: SelectionState<TKey>): readonly TKey[] {
  return selectedKeys(state);
}

describe('createSelection — construction + mode normalisation', () => {
  it('defaults to multiple mode with an empty selection and no anchor', () => {
    const state = createSelection<string>();
    expect(state.mode).toBe(SelectionMode.Multiple);
    expect(keysOf(state)).toEqual([]);
    expect(state.anchor).toBeNull();
  });

  it('seeds keys in the given order', () => {
    expect(keysOf(createSelection('multiple', ['c', 'a', 'b']))).toEqual(['c', 'a', 'b']);
  });

  it('drops every key in none mode', () => {
    const state = createSelection('none', ['a', 'b']);
    expect(keysOf(state)).toEqual([]);
    expect(state.anchor).toBeNull();
  });

  it('keeps only the first key in single mode', () => {
    expect(keysOf(createSelection('single', ['b', 'a']))).toEqual(['b']);
  });

  it('re-modes an existing state through the same entry point', () => {
    const multiple = createSelection('multiple', ['a', 'b', 'c']);
    expect(keysOf(createSelection('single', multiple.keys))).toEqual(['a']);
  });
});

describe('selection — reads', () => {
  const state = createSelection('multiple', ['a', 'c']);

  it('reports membership', () => {
    expect(isSelected(state, 'a')).toBe(true);
    expect(isSelected(state, 'b')).toBe(false);
  });

  it('counts the selection', () => {
    expect(selectionCount(state)).toBe(2);
    expect(selectionCount(createSelection<string>())).toBe(0);
  });

  it('returns keys in insertion order', () => {
    const grown = select(select(createSelection<string>(), 'z'), 'a');
    expect(keysOf(grown)).toEqual(['z', 'a']);
  });
});

describe('select', () => {
  it('adds a key and anchors on it', () => {
    const state = select(createSelection('multiple', ['a']), 'c');
    expect(keysOf(state)).toEqual(['a', 'c']);
    expect(state.anchor).toBe('c');
  });

  it('accumulates in multiple mode', () => {
    const state = select(select(createSelection<string>(), 'a'), 'b');
    expect(keysOf(state)).toEqual(['a', 'b']);
  });

  it('replaces rather than accumulates in single mode', () => {
    const state = select(select(createSelection<string>('single'), 'a'), 'b');
    expect(keysOf(state)).toEqual(['b']);
    expect(state.anchor).toBe('b');
  });

  it('is inert in none mode', () => {
    const initial = createSelection<string>('none');
    expect(select(initial, 'a')).toBe(initial);
  });

  it('returns the same state when the key is already selected and anchored', () => {
    const initial = select(createSelection<string>(), 'a');
    expect(select(initial, 'a')).toBe(initial);
  });
});

describe('deselect', () => {
  it('removes a key and anchors on it', () => {
    const state = deselect(createSelection('multiple', ['a', 'b']), 'a');
    expect(keysOf(state)).toEqual(['b']);
    expect(state.anchor).toBe('a');
  });

  it('is inert when the key was not selected', () => {
    const initial = createSelection('multiple', ['a']);
    expect(deselect(initial, 'z')).toBe(initial);
  });

  it('is inert in none mode', () => {
    const initial = createSelection<string>('none');
    expect(deselect(initial, 'a')).toBe(initial);
  });
});

describe('toggle', () => {
  it('selects an unselected key', () => {
    expect(keysOf(toggle(createSelection<string>(), 'a'))).toEqual(['a']);
  });

  it('deselects a selected key', () => {
    expect(keysOf(toggle(createSelection('multiple', ['a', 'b']), 'a'))).toEqual(['b']);
  });

  it('moves the anchor either way', () => {
    expect(toggle(createSelection<string>(), 'a').anchor).toBe('a');
    expect(toggle(createSelection('multiple', ['a']), 'a').anchor).toBe('a');
  });

  it('clears the selection when toggling the selected key in single mode', () => {
    expect(keysOf(toggle(createSelection('single', ['a']), 'a'))).toEqual([]);
  });

  it('replaces the selection when toggling another key in single mode', () => {
    expect(keysOf(toggle(createSelection('single', ['a']), 'b'))).toEqual(['b']);
  });

  it('is inert in none mode', () => {
    const initial = createSelection<string>('none');
    expect(toggle(initial, 'a')).toBe(initial);
  });
});

describe('selectAll', () => {
  it('unions the given keys into the selection', () => {
    expect(keysOf(selectAll(createSelection('multiple', ['a']), ['b', 'c']))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('keeps keys selected outside the given set', () => {
    const state = selectAll(createSelection('multiple', ['z']), ROWS);
    expect(keysOf(state)).toContain('z');
  });

  it('leaves the anchor alone', () => {
    const anchored = select(createSelection<string>(), 'a');
    expect(selectAll(anchored, ['b', 'c']).anchor).toBe('a');
  });

  it('is inert in single and none modes', () => {
    const single = createSelection<string>('single');
    const none = createSelection<string>('none');
    expect(selectAll(single, ROWS)).toBe(single);
    expect(selectAll(none, ROWS)).toBe(none);
  });
});

describe('clear', () => {
  it('empties the selection and drops the anchor', () => {
    const state = clear(select(createSelection('multiple', ['a', 'b']), 'c'));
    expect(keysOf(state)).toEqual([]);
    expect(state.anchor).toBeNull();
  });

  it('returns the same state when already empty and unanchored', () => {
    const initial = createSelection<string>();
    expect(clear(initial)).toBe(initial);
  });
});

describe('invert', () => {
  it('flips membership of every given key', () => {
    const state = invert(createSelection('multiple', ['a', 'c']), ['a', 'b', 'c']);
    expect([...keysOf(state)].sort()).toEqual(['b']);
  });

  it('leaves selections outside the given keys untouched — the filtered-set rule', () => {
    const state = invert(createSelection('multiple', ['a', 'z']), ['a', 'b']);
    expect([...keysOf(state)].sort()).toEqual(['b', 'z']);
  });

  it('is inert in single and none modes', () => {
    const single = createSelection<string>('single');
    const none = createSelection<string>('none');
    expect(invert(single, ROWS)).toBe(single);
    expect(invert(none, ROWS)).toBe(none);
  });
});

describe('toggleAll — the header checkbox', () => {
  it('selects every given key when none is selected', () => {
    expect(keysOf(toggleAll(createSelection<string>(), ['a', 'b']))).toEqual(['a', 'b']);
  });

  it('selects every given key when only some are selected', () => {
    const state = toggleAll(createSelection('multiple', ['a']), ['a', 'b']);
    expect([...keysOf(state)].sort()).toEqual(['a', 'b']);
  });

  it('deselects every given key when all are selected', () => {
    expect(keysOf(toggleAll(createSelection('multiple', ['a', 'b']), ['a', 'b']))).toEqual([]);
  });

  it('keeps out-of-scope selections when deselecting the scope', () => {
    const state = toggleAll(createSelection('multiple', ['a', 'b', 'z']), ['a', 'b']);
    expect(keysOf(state)).toEqual(['z']);
  });

  it('is inert on an empty key list', () => {
    const initial = createSelection('multiple', ['a']);
    expect(toggleAll(initial, [])).toBe(initial);
  });

  it('is inert in single and none modes', () => {
    const single = createSelection('single', ['a']);
    const none = createSelection<string>('none');
    expect(toggleAll(single, ROWS)).toBe(single);
    expect(toggleAll(none, ROWS)).toBe(none);
  });
});

describe('selectionStatus — the tri-state', () => {
  it('is none with nothing selected', () => {
    expect(selectionStatus(createSelection<string>(), ROWS)).toBe(SelectionStatus.None);
  });

  it('is some with a partial selection', () => {
    expect(selectionStatus(createSelection('multiple', ['a', 'b']), ROWS)).toBe(
      SelectionStatus.Some,
    );
  });

  it('is all when every given key is selected', () => {
    expect(selectionStatus(createSelection('multiple', ROWS), ROWS)).toBe(SelectionStatus.All);
  });

  it('is all over a filtered subset even when other keys are selected', () => {
    const state = createSelection('multiple', ['a', 'b', 'z']);
    expect(selectionStatus(state, ['a', 'b'])).toBe(SelectionStatus.All);
  });

  it('is none for an empty key list', () => {
    expect(selectionStatus(createSelection('multiple', ['a']), [])).toBe(SelectionStatus.None);
  });
});

describe('selectRange — shift-click', () => {
  it('selects the run forward from the anchor', () => {
    const state = selectRange(createSelection<string>(), 'b', 'd', [...ROWS]);
    expect(keysOf(state)).toEqual(['b', 'c', 'd']);
  });

  it('selects the same run backward from the anchor', () => {
    const state = selectRange(createSelection<string>(), 'd', 'b', [...ROWS]);
    expect([...keysOf(state)].sort()).toEqual(['b', 'c', 'd']);
  });

  it('keeps the anchor at the anchor so successive extensions measure from one fixed end', () => {
    const first = selectRange(createSelection<string>(), 'b', 'd', [...ROWS]);
    expect(first.anchor).toBe('b');
    const second = selectRange(first, first.anchor ?? 'b', 'c', [...ROWS]);
    expect(second.anchor).toBe('b');
  });

  it('unions with the existing selection by default', () => {
    const state = selectRange(createSelection('multiple', ['z']), 'b', 'c', [...ROWS]);
    expect([...keysOf(state)].sort()).toEqual(['b', 'c', 'z']);
  });

  it('replaces the selection when isAdditive is false', () => {
    const state = selectRange(createSelection('multiple', ['z']), 'b', 'c', [...ROWS], {
      isAdditive: false,
    });
    expect(keysOf(state)).toEqual(['b', 'c']);
  });

  it('measures from a changed anchor', () => {
    const first = selectRange(createSelection<string>(), 'a', 'b', [...ROWS]);
    const reanchored = select(first, 'd');
    expect(reanchored.anchor).toBe('d');
    const second = selectRange(reanchored, reanchored.anchor ?? 'd', 'e', [...ROWS]);
    expect([...keysOf(second)].sort()).toEqual(['a', 'b', 'd', 'e']);
  });

  it('follows the given visual order, not the key order', () => {
    const reordered = ['e', 'd', 'c', 'b', 'a'];
    const state = selectRange(createSelection<string>(), 'e', 'c', reordered);
    expect(keysOf(state)).toEqual(['e', 'd', 'c']);
  });

  it('is inert when the target is not in the ordered keys', () => {
    const initial = createSelection<string>();
    expect(selectRange(initial, 'a', 'zz', [...ROWS])).toBe(initial);
  });

  it('falls back to the target alone when the anchor is not in the ordered keys', () => {
    const state = selectRange(createSelection<string>(), 'zz', 'c', [...ROWS]);
    expect(keysOf(state)).toEqual(['c']);
    expect(state.anchor).toBe('c');
  });

  it('collapses to a plain select in single mode', () => {
    const state = selectRange(createSelection<string>('single'), 'a', 'd', [...ROWS]);
    expect(keysOf(state)).toEqual(['d']);
  });

  it('is inert in none mode', () => {
    const initial = createSelection<string>('none');
    expect(selectRange(initial, 'a', 'd', [...ROWS])).toBe(initial);
  });
});

describe('extendSelection — shift-click against the tracked anchor', () => {
  it('extends from the state anchor', () => {
    const anchored = select(createSelection<string>(), 'b');
    expect(keysOf(extendSelection(anchored, 'd', [...ROWS]))).toEqual(['b', 'c', 'd']);
  });

  it('selects the target alone and anchors on it when there is no anchor yet', () => {
    const state = extendSelection(createSelection<string>(), 'c', [...ROWS]);
    expect(keysOf(state)).toEqual(['c']);
    expect(state.anchor).toBe('c');
  });

  it('shrinks a range when extended back toward the anchor with isAdditive false', () => {
    const anchored = select(createSelection<string>(), 'b');
    const grown = extendSelection(anchored, 'e', [...ROWS], { isAdditive: false });
    expect(keysOf(grown)).toEqual(['b', 'c', 'd', 'e']);
    const shrunk = extendSelection(grown, 'c', [...ROWS], { isAdditive: false });
    expect(keysOf(shrunk)).toEqual(['b', 'c']);
  });
});

describe('selection — immutability', () => {
  it('never mutates the state handed to an op', () => {
    const initial = createSelection('multiple', ['a', 'b']);
    const snapshot = [...initial.keys];

    select(initial, 'c');
    deselect(initial, 'a');
    toggle(initial, 'z');
    selectAll(initial, ['x', 'y']);
    invert(initial, ['a', 'q']);
    toggleAll(initial, ['a', 'b']);
    clear(initial);
    selectRange(initial, 'a', 'e', [...ROWS]);
    extendSelection(initial, 'e', [...ROWS]);

    expect([...initial.keys]).toEqual(snapshot);
    expect(initial.keys.size).toBe(2);
    expect(initial.anchor).toBeNull();
  });

  it('returns a new state object whenever the selection changes', () => {
    const initial = createSelection('multiple', ['a']);
    const next = select(initial, 'b');
    expect(next).not.toBe(initial);
    expect(next.keys).not.toBe(initial.keys);
  });
});
