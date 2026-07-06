import { cleanup, renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTypeahead, type UseTypeaheadOptions } from './useTypeahead';

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

function keyEvent(key: string, mods: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...mods,
  } as unknown as KeyboardEvent;
}

type Options = UseTypeaheadOptions<string>;

const fruits = ['Apple', 'Avocado', 'Apricot', 'Banana', 'Blueberry', 'Cherry'] as const;

function setup(overrides: Partial<Options> = {}) {
  const onMatch = vi.fn();
  const initial: Options = {
    items: fruits,
    getLabel: (item) => item,
    onMatch,
    ...overrides,
  };
  const view = renderHook((props: Options) => useTypeahead(props), { initialProps: initial });
  const press = (key: string, mods: Partial<KeyboardEvent> = {}): boolean =>
    view.result.current.onKeyDown(keyEvent(key, mods));
  return { ...view, onMatch, press, initial };
}

describe('useTypeahead — key filtering', () => {
  it('named keys fall through unhandled', () => {
    const { press, onMatch } = setup();
    expect(press('Enter')).toBe(false);
    expect(press('ArrowDown')).toBe(false);
    expect(press('Escape')).toBe(false);
    expect(onMatch).not.toHaveBeenCalled();
  });

  it('modifier chords fall through unhandled', () => {
    const { press, onMatch } = setup();
    expect(press('a', { ctrlKey: true })).toBe(false);
    expect(press('a', { metaKey: true })).toBe(false);
    expect(press('a', { altKey: true })).toBe(false);
    expect(onMatch).not.toHaveBeenCalled();
  });

  it('a leading Space falls through (reserved for select)', () => {
    const { press, onMatch } = setup();
    expect(press(' ')).toBe(false);
    expect(onMatch).not.toHaveBeenCalled();
  });

  it('an empty item list falls through', () => {
    const { press, onMatch } = setup({ items: [] });
    expect(press('a')).toBe(false);
    expect(onMatch).not.toHaveBeenCalled();
  });

  it('enabled: false disables the matcher entirely', () => {
    const { press, onMatch } = setup({ enabled: false });
    expect(press('a')).toBe(false);
    expect(onMatch).not.toHaveBeenCalled();
  });
});

describe('useTypeahead — matching', () => {
  it.each(['b', 'B'])(
    'matches the first label starting with the char, case-insensitively (%s)',
    (key) => {
      const { press, onMatch } = setup();
      expect(press(key)).toBe(true);
      expect(onMatch).toHaveBeenCalledTimes(1);
      expect(onMatch).toHaveBeenCalledWith('Banana', 3);
    },
  );

  it('matches through getLabel and reports the item object + live index', () => {
    interface Item {
      name: string;
    }
    const items: Item[] = [{ name: 'Alpha' }, { name: 'Beta' }];
    const onMatch = vi.fn();
    const { result } = renderHook(() =>
      useTypeahead<Item>({ items, getLabel: (item) => item.name, onMatch }),
    );

    expect(result.current.onKeyDown(keyEvent('b'))).toBe(true);
    expect(onMatch).toHaveBeenCalledWith(items[1], 1);
  });

  it('accumulates the buffer across keystrokes into a prefix match', () => {
    const { press, onMatch } = setup();
    press('b');
    expect(onMatch).toHaveBeenLastCalledWith('Banana', 3);
    press('l');
    expect(onMatch).toHaveBeenLastCalledWith('Blueberry', 4);
    expect(onMatch).toHaveBeenCalledTimes(2);
  });

  it('an unmatched printable is still consumed (returns true, no onMatch)', () => {
    const { press, onMatch } = setup();
    expect(press('z')).toBe(true);
    expect(onMatch).not.toHaveBeenCalled();
  });

  it('Space is a real character while buffering (matches labels with spaces)', () => {
    const { press, onMatch } = setup({ items: ['Newark', 'New York'] });
    press('n');
    press('e');
    press('w');
    expect(onMatch).toHaveBeenLastCalledWith('Newark', 0);
    expect(press(' ')).toBe(true);
    expect(onMatch).toHaveBeenLastCalledWith('New York', 1);
  });

  it('skips disabled items', () => {
    const { press, onMatch } = setup({ isDisabled: (item) => item === 'Apple' });
    press('a');
    expect(onMatch).toHaveBeenCalledWith('Avocado', 1);
  });

  it('consumes the key without a match when every candidate is disabled', () => {
    const { press, onMatch } = setup({ items: ['Apple'], isDisabled: () => true });
    expect(press('a')).toBe(true);
    expect(onMatch).not.toHaveBeenCalled();
  });
});

describe('useTypeahead — same-letter cycling', () => {
  it('a repeated char cycles through matches after the active index, wrapping around', () => {
    let active = -1;
    const { press, onMatch } = setup({
      items: ['Apple', 'Avocado', 'Apricot', 'Banana'],
      getActiveIndex: () => active,
    });

    press('a');
    expect(onMatch).toHaveBeenLastCalledWith('Apple', 0);
    active = 0;

    press('a');
    expect(onMatch).toHaveBeenLastCalledWith('Avocado', 1);
    active = 1;

    press('a');
    expect(onMatch).toHaveBeenLastCalledWith('Apricot', 2);
    active = 2;

    press('a'); // Banana doesn't match → wraps past the end back to Apple
    expect(onMatch).toHaveBeenLastCalledWith('Apple', 0);
  });
});

describe('useTypeahead — multi-char scan origin', () => {
  it('a refining buffer stays on the active item while it still matches', () => {
    let active = -1;
    const { press, onMatch } = setup({
      items: ['Cherry', 'Chocolate'],
      getActiveIndex: () => active,
    });

    press('c');
    expect(onMatch).toHaveBeenLastCalledWith('Cherry', 0);
    active = 0;

    press('h'); // "ch" — active item still matches → stays put
    expect(onMatch).toHaveBeenLastCalledWith('Cherry', 0);

    press('o'); // "cho" — active item stops matching → moves on
    expect(onMatch).toHaveBeenLastCalledWith('Chocolate', 1);
  });

  it('the multi-char prefix scan wraps past the end of the list', () => {
    const { press, onMatch } = setup({
      items: ['Cherry', 'Chocolate'],
      getActiveIndex: () => 1,
    });

    press('c');
    press('h');
    expect(onMatch).toHaveBeenLastCalledWith('Chocolate', 1);
    press('e'); // "che" — scan starts at index 1, wraps to find Cherry at 0
    expect(onMatch).toHaveBeenLastCalledWith('Cherry', 0);
  });
});

describe('useTypeahead — buffer timeout', () => {
  it('the buffer survives keystrokes inside the idle window', () => {
    vi.useFakeTimers();
    const { press, onMatch } = setup();

    press('b');
    vi.advanceTimersByTime(499);
    press('l');

    expect(onMatch).toHaveBeenLastCalledWith('Blueberry', 4);
  });

  it('the buffer resets after the default 500 ms idle window', () => {
    vi.useFakeTimers();
    const { press, onMatch } = setup();

    press('b');
    expect(onMatch).toHaveBeenLastCalledWith('Banana', 3);
    vi.advanceTimersByTime(500);
    press('a'); // fresh buffer "a", not "ba"

    expect(onMatch).toHaveBeenLastCalledWith('Apple', 0);
  });

  it('every accepted keystroke restarts the idle window', () => {
    vi.useFakeTimers();
    const { press, onMatch } = setup();

    press('b');
    vi.advanceTimersByTime(400);
    press('l');
    vi.advanceTimersByTime(400); // 800 ms since the first key, 400 ms since the last
    press('u');

    expect(onMatch).toHaveBeenLastCalledWith('Blueberry', 4); // "blu" — buffer never reset
  });

  it('honors a custom timeout', () => {
    vi.useFakeTimers();
    const { press, onMatch } = setup({ timeout: 100 });

    press('b');
    vi.advanceTimersByTime(100);
    press('a');

    expect(onMatch).toHaveBeenLastCalledWith('Apple', 0);
  });
});

describe('useTypeahead — reset & lifecycle', () => {
  it('reset() clears the buffer immediately', () => {
    const { press, onMatch, result } = setup();

    press('b');
    expect(onMatch).toHaveBeenLastCalledWith('Banana', 3);
    result.current.reset();
    press('a'); // fresh buffer "a", not "ba"

    expect(onMatch).toHaveBeenLastCalledWith('Apple', 0);
  });

  it('toggling enabled off mid-type clears the pending buffer', () => {
    const { press, onMatch, rerender, initial } = setup({
      items: ['Banana', 'Blueberry', 'Apple'],
    });

    press('b');
    expect(onMatch).toHaveBeenLastCalledWith('Banana', 0);

    rerender({ ...initial, enabled: false });
    rerender({ ...initial, enabled: true });
    press('a'); // fresh buffer "a" — a stale "ba" would re-match Banana

    expect(onMatch).toHaveBeenLastCalledWith('Apple', 2);
  });

  it('re-reads an items getter on every keystroke (live lists)', () => {
    let items: readonly string[] = ['Blueberry', 'Apple'];
    const { press, onMatch } = setup({ items: () => items });

    press('a');
    expect(onMatch).toHaveBeenLastCalledWith('Apple', 1);

    items = ['Avocado', 'Ant'];
    press('a'); // "aa" same-char cycle over the NEW list
    expect(onMatch).toHaveBeenLastCalledWith('Avocado', 0);
  });

  it('onKeyDown keeps a stable identity across option changes', () => {
    const { result, rerender, initial } = setup();
    const handler = result.current.onKeyDown;
    rerender({ ...initial, timeout: 250 });
    expect(result.current.onKeyDown).toBe(handler);
  });
});
