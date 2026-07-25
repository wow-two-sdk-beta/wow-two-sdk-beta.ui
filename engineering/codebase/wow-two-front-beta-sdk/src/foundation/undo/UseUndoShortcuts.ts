// The keyboard binding — opt-in, and separate from the history on purpose.
//
// ⌘Z is conventional, not universal: a history driving a background job queue, a wizard's step stack, or a
// second nested editor must not silently steal the window's undo key. So `createUndoHistory` binds nothing, and
// a surface that wants the convention calls this hook. Chords route through `foundation/shortcuts`' parser, so
// `mod` resolves to ⌘ on Apple and Ctrl elsewhere and the app never hard-codes a platform.
//
// Non-obvious decisions:
// - Redo binds BOTH `mod+shift+z` and `mod+y`. The first is the Apple/Linux convention, the second the Windows
//   one, and users carry the muscle memory of whichever they learned. Binding one and not the other reads as a
//   broken redo to half the audience.
// - The target is typed as `UndoRedoTarget`, the four-member subset both flavors satisfy — this hook works with
//   a command history, a snapshot history, or an app's own object that merely behaves like one.
// - `useHotkeyMap` lets a Ctrl/⌘ combo through even while a text field has focus (a bare key is suppressed, a
//   mod combo is not), so ⌘Z fires while the user is typing. That is right for an app-owned document and WRONG
//   where the field's own native undo should win — `preventDefault` defaults to true and will suppress it.
//   Scope with `target` or gate with `enabled` on surfaces where the browser should keep the key.
// - The handler map is rebuilt every render rather than memoised: `useHotkeyMap` reads handlers from a ref and
//   keys its effect off the chord set, so a fresh object costs nothing and a stale `target` closure is avoided.

import { useHotkeyMap, type HotkeyOptions } from '../shortcuts';
import type { UndoRedoTarget } from './HistoryCore';

/** The conventional undo chord — ⌘Z on Apple, Ctrl+Z elsewhere. */
const DEFAULT_UNDO_CHORDS: readonly string[] = ['mod+z'];

/** The conventional redo chords — the Apple/Linux `⌘⇧Z` and the Windows `Ctrl+Y`, both bound. */
const DEFAULT_REDO_CHORDS: readonly string[] = ['mod+shift+z', 'mod+y'];

/** Tunes {@link useUndoShortcuts}; every {@link HotkeyOptions} field (`enabled`, `target`, …) applies as usual. */
export interface UndoShortcutOptions extends HotkeyOptions {
  /** Chord(s) that trigger `undo()`. Defaults to `'mod+z'`. */
  readonly undoChords?: string | readonly string[];

  /** Chord(s) that trigger `redo()`. Defaults to `['mod+shift+z', 'mod+y']`. */
  readonly redoChords?: string | readonly string[];
}

/** Normalises the one-or-many chord option into a list. */
function toChordList(chords: string | readonly string[]): readonly string[] {
  return typeof chords === 'string' ? [chords] : chords;
}

/**
 * Binds the conventional undo / redo chords to a history. Opt-in — nothing is bound unless a surface calls this.
 *
 * ```ts
 * const history = useUndoHistory();
 * useUndoShortcuts(history);                          // ⌘Z · ⌘⇧Z · ⌘Y
 * useUndoShortcuts(history, { enabled: !isModalOpen }); // suspended while a dialog owns the keyboard
 * ```
 */
export function useUndoShortcuts(target: UndoRedoTarget, options?: UndoShortcutOptions): void {
  const {
    undoChords = DEFAULT_UNDO_CHORDS,
    redoChords = DEFAULT_REDO_CHORDS,
    ...hotkeyOptions
  } = options ?? {};

  const map: Record<string, (event: KeyboardEvent) => void> = {};
  for (const chord of toChordList(undoChords)) {
    map[chord] = () => {
      target.undo();
    };
  }
  for (const chord of toChordList(redoChords)) {
    map[chord] = () => {
      target.redo();
    };
  }

  useHotkeyMap(map, hotkeyOptions);
}
