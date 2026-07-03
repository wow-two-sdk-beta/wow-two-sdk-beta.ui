import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

/** Resolves the typeahead item pool — a static array or a getter read lazily on each keystroke. */
type ItemSource<T> = readonly T[] | (() => readonly T[]);

/** Configures {@link useTypeahead}. `T` is the item type the caller stores per option. */
export interface UseTypeaheadOptions<T> {
  /** Supplies the items to match against; a function is re-read on every keystroke (live lists). */
  items: ItemSource<T>;
  /** Extracts the comparable label from an item. Matching is case-insensitive on this string. */
  getLabel: (item: T) => string;
  /** Reports whether an item is disabled; disabled items are skipped during matching. */
  isDisabled?: (item: T) => boolean;
  /** Fires with the matched item and its index in the (live) item array when a keystroke resolves. */
  onMatch: (item: T, index: number) => void;
  /** Returns the index of the currently-active item — same-letter cycling starts after it. */
  getActiveIndex?: () => number;
  /** Disables the matcher when `false`; every key falls through unhandled. Defaults to `true`. */
  enabled?: boolean;
  /** Idle time (ms) after which the typed buffer resets. Defaults to `500`. */
  timeout?: number;
}

/** The keyboard handler + manual reset returned by {@link useTypeahead}. */
export interface UseTypeaheadReturn {
  /** Feeds a keydown into the matcher. Returns `true` when consumed (caller should stop), else `false`. */
  onKeyDown: (event: KeyboardEvent) => boolean;
  /** Clears the typed buffer immediately (e.g. on blur / close). */
  reset: () => void;
}

/** Reports whether a key event carries a single printable character (and no command modifier). */
function isPrintableKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  // Printable keys surface as a single char in `key`; named keys (Enter, ArrowDown…) are multi-char.
  return event.key.length === 1;
}

/** Reports whether every char in the buffer is the same letter — the "cycle" case (e.g. "aaa"). */
function isAllSameChar(buffer: string): boolean {
  return buffer.length > 0 && [...buffer].every((c) => c === buffer[0]);
}

/**
 * APG-correct type-to-select matcher (WAI-ARIA listbox/combobox typeahead). Accumulates printable
 * chars into a buffer (resets after `timeout` ms idle): a repeated single char cycles to the next
 * label starting with it (after `getActiveIndex()`, wrap-around), else prefix-matches the whole
 * buffer case-insensitively; disabled items skipped. On a hit `onMatch(item, index)` fires; consumed
 * keys return `true`, others `false` to fall through. Space is typeable only while buffering (a
 * leading Space reaches the caller). SSR-safe; reset timer cleared on unmount.
 */
export function useTypeahead<T>(options: UseTypeaheadOptions<T>): UseTypeaheadReturn {
  const { enabled = true } = options;

  /* Consumer fns/values read through a ref so `onKeyDown` stays referentially stable
     (callers wire it into their own memoised keydown handlers). */
  const optsRef = useRef(options);
  optsRef.current = options;

  const bufferRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    bufferRef.current = '';
    clearTimer();
  }, [clearTimer]);

  /* Clears the pending reset timer on unmount (no stale fire after teardown). */
  useEffect(() => clearTimer, [clearTimer]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      const o = optsRef.current;
      if (o.enabled === false) return false;
      if (!isPrintableKey(event)) return false;

      const isSpace = event.key === ' ';
      const hasBuffer = bufferRef.current.length > 0;
      /* Reserve Space: with no active buffer, hand it back so the caller can select; while typing,
         a Space is a real character (matches labels with spaces) and is consumed. */
      if (isSpace && !hasBuffer) return false;

      const resolved = typeof o.items === 'function' ? o.items() : o.items;
      const list = resolved as readonly T[];
      if (list.length === 0) return false;

      const nextBuffer = bufferRef.current + event.key;
      bufferRef.current = nextBuffer;

      /* Restart the idle window on every accepted keystroke. */
      clearTimer();
      timerRef.current = setTimeout(() => {
        bufferRef.current = '';
        timerRef.current = null;
      }, o.timeout ?? 500);

      const labelOf = (item: T) => o.getLabel(item).toLowerCase();
      const disabledOf = (item: T) => (o.isDisabled ? o.isDisabled(item) : false);
      const startFrom = o.getActiveIndex ? o.getActiveIndex() : -1;

      let matchIndex = -1;
      if (isAllSameChar(nextBuffer)) {
        /* Same-letter repeat → cycle to the next label starting with that letter, after the active one. */
        const char = nextBuffer[0]!.toLowerCase();
        for (let step = 1; step <= list.length; step += 1) {
          const idx = (startFrom + step + list.length) % list.length;
          const item = list[idx]!;
          if (!disabledOf(item) && labelOf(item).startsWith(char)) {
            matchIndex = idx;
            break;
          }
        }
      } else {
        /* Multi-char buffer → prefix-match the whole buffer; scan from the current item forward so a
           refining sequence stays put when the active item still matches. */
        const prefix = nextBuffer.toLowerCase();
        const begin = startFrom < 0 ? 0 : startFrom;
        for (let step = 0; step < list.length; step += 1) {
          const idx = (begin + step) % list.length;
          const item = list[idx]!;
          if (!disabledOf(item) && labelOf(item).startsWith(prefix)) {
            matchIndex = idx;
            break;
          }
        }
      }

      if (matchIndex >= 0) {
        o.onMatch(list[matchIndex]!, matchIndex);
        return true;
      }
      /* No label matched, but the char was consumed into the buffer (and Space, once buffering,
         must not double as select) — report handled so the caller doesn't also act on it. */
      return true;
    },
    [clearTimer],
  );

  /* `enabled` toggling off mid-type should not leave a stale buffer/timer armed. */
  useEffect(() => {
    if (!enabled) reset();
  }, [enabled, reset]);

  return { onKeyDown, reset };
}
