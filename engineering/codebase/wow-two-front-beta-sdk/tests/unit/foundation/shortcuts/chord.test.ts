import { describe, expect, it } from 'vitest';

import {
  formatChord,
  formatChordString,
  isApplePlatform,
  matchesChord,
  parseChord,
  type KeyboardEventLike,
} from '@src/foundation/shortcuts';

// Node project — the chord model is pure (no DOM). Platform is passed explicitly (`applePlatform`) so `mod`
// resolution is deterministic regardless of the host running the suite.

/** Builds a minimal keyboard-event-like object for `matchesChord`. */
function evt(key: string, mods: Partial<KeyboardEventLike> = {}): KeyboardEventLike {
  return { key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods };
}

describe('parseChord', () => {
  it('resolves `mod` to meta on Apple and ctrl elsewhere', () => {
    expect(parseChord('mod+k', { applePlatform: true })).toEqual({
      key: 'k',
      ctrl: false,
      meta: true,
      shift: false,
      alt: false,
    });
    expect(parseChord('mod+k', { applePlatform: false })).toEqual({
      key: 'k',
      ctrl: true,
      meta: false,
      shift: false,
      alt: false,
    });
  });

  it('parses modifiers in any order and is case-insensitive', () => {
    expect(parseChord('Shift+Mod+K', { applePlatform: false })).toEqual(
      parseChord('mod+shift+k', { applePlatform: false }),
    );
  });

  it('maps named-key aliases to their canonical KeyboardEvent.key', () => {
    expect(parseChord('esc').key).toBe('Escape');
    expect(parseChord('up').key).toBe('ArrowUp');
    expect(parseChord('del').key).toBe('Delete');
    expect(parseChord('ctrl+enter', { applePlatform: false }).key).toBe('Enter');
  });

  it('supports symbol and function keys', () => {
    expect(parseChord('ctrl+/', { applePlatform: false }).key).toBe('/');
    expect(parseChord('f5').key).toBe('F5');
    expect(parseChord('mod+plus', { applePlatform: true }).key).toBe('+');
  });

  it('accepts symbol modifier tokens (⌘ ⇧ ⌥ ^)', () => {
    expect(parseChord('⌘+⇧+p')).toEqual({ key: 'p', ctrl: false, meta: true, shift: true, alt: false });
  });

  it('throws when no non-modifier key is present', () => {
    expect(() => parseChord('mod+shift')).toThrow(/no non-modifier key/);
  });
});

describe('matchesChord', () => {
  it('matches when every modifier is exact and the key is case-insensitive', () => {
    const chord = parseChord('mod+k', { applePlatform: true });
    expect(matchesChord(evt('k', { metaKey: true }), chord)).toBe(true);
    expect(matchesChord(evt('K', { metaKey: true }), chord)).toBe(true);
  });

  it('rejects when a modifier differs', () => {
    const chord = parseChord('mod+k', { applePlatform: true });
    expect(matchesChord(evt('k', { metaKey: true, shiftKey: true }), chord)).toBe(false);
    expect(matchesChord(evt('k'), chord)).toBe(false); // no meta held
  });

  it('rejects when the key differs', () => {
    const chord = parseChord('ctrl+a', { applePlatform: false });
    expect(matchesChord(evt('b', { ctrlKey: true }), chord)).toBe(false);
  });
});

describe('formatChord / formatChordString', () => {
  it('renders the compact symbol form on Apple', () => {
    expect(formatChordString('mod+k', { applePlatform: true })).toBe('⌘K');
    expect(formatChordString('ctrl+alt+shift+mod+k', { applePlatform: true })).toBe('⌃⌥⇧⌘K');
  });

  it('renders the +-joined word form off Apple', () => {
    expect(formatChordString('mod+k', { applePlatform: false })).toBe('Ctrl+K');
    expect(formatChordString('mod+shift+p', { applePlatform: false })).toBe('Ctrl+Shift+P');
  });

  it('renders arrow and space glyphs', () => {
    expect(formatChord(parseChord('up'), { applePlatform: true })).toBe('↑');
    expect(formatChord(parseChord('mod+up', { applePlatform: true }), { applePlatform: true })).toBe('⌘↑');
  });
});

describe('isApplePlatform', () => {
  it('detects Apple platforms from a hint string', () => {
    expect(isApplePlatform('MacIntel')).toBe(true);
    expect(isApplePlatform('iPhone')).toBe(true);
    expect(isApplePlatform('Win32')).toBe(false);
    expect(isApplePlatform('Linux x86_64')).toBe(false);
  });
});
