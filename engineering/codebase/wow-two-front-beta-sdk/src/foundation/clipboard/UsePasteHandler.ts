// The React binding of the paste path — a `paste` listener with the extraction already done and the teardown
// guaranteed.
//
// WHY A HOOK RATHER THAN AN `onPaste` PROP. A React `onPaste` only fires for a paste into that element, which
// requires it to be focusable and focused. The common feature — "paste a screenshot anywhere on this page" —
// needs a `window` listener, and hand-rolling one means an effect, a ref for the handler, and a cleanup that
// people forget. Defaulting to `window` and accepting a `target` ref covers both shapes.
//
// The handler is read from a ref, so passing a fresh arrow each render does NOT detach and re-attach the
// listener every commit — the same shape `foundation/share`'s `useShare` and `foundation/shortcuts`' `useHotkeys`
// use. Only `enabled` / `target` / `preventDefault` re-run the effect, because only those change what is bound.
//
// A throw from the consumer's handler is swallowed. Inside a native listener a throw does not reject anything —
// it escapes to `window.onerror` and, worse, skips the rest of the listener including a `preventDefault` the
// consumer asked for. Absorbing it keeps the slice's never-throws contract at the one boundary where the
// consumer's own code runs.

import { useEffect, useRef, type RefObject } from 'react';

import { getPasteItems, type PasteItems } from './PasteItems';

/** Tunes a {@link usePasteHandler} binding. */
export interface UsePasteHandlerOptions {
  /**
   * The element to listen on. Defaults to `window`, which catches a paste anywhere on the page — the right
   * default for a drop-zone or an editor surface that is not itself focused. Pass a ref to scope the listener to
   * one element.
   */
  readonly target?: RefObject<HTMLElement | null>;

  /**
   * Whether the listener is attached. Defaults to `true`; pass `false` to suspend it without unmounting — a
   * modal that should own pastes only while open.
   */
  readonly enabled?: boolean;

  /**
   * Whether to call `preventDefault()` on the event, suppressing the browser's own paste. Defaults to `false`.
   *
   * Turn it on when the handler fully owns the paste (inserting the image itself); leave it off when the handler
   * is a side effect and the default insert should still happen. Applied BEFORE the handler runs, so a throw
   * from the handler cannot skip it.
   */
  readonly preventDefault?: boolean;
}

/**
 * Binds a `paste` listener that hands the handler the event's already-extracted text, HTML, and files.
 *
 * Needs no clipboard permission — see `PasteItems.ts` for why this is the path to prefer over `readText`. Detaches
 * on unmount, and on any change to `enabled` / `target` / `preventDefault`.
 *
 * SSR-safe: with no `window` and no `target`, the effect binds nothing and the hook is inert.
 *
 * @param handler Called on every paste with the extracted payload and the original event. Its identity may
 *   change freely between renders without re-binding the listener. A throw from it is swallowed.
 * @param options Where to listen, whether to listen, and whether to suppress the default paste.
 */
export function usePasteHandler(
  handler: (items: PasteItems, event: ClipboardEvent) => void,
  options?: UsePasteHandlerOptions,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const target = options?.target;
  const enabled = options?.enabled ?? true;
  const preventDefault = options?.preventDefault ?? false;

  useEffect(() => {
    if (!enabled) return;

    // Read inside the effect, not during render: a ref's `current` is only attached by the time effects run.
    const node: EventTarget | null = target?.current ?? (typeof window === 'undefined' ? null : window);
    if (node === null || typeof node.addEventListener !== 'function') return;

    const listener = (event: Event): void => {
      const pasteEvent = event as ClipboardEvent;
      if (preventDefault) {
        try {
          pasteEvent.preventDefault();
        } catch {
          // A synthetic event without a usable `preventDefault`. The handler still gets its payload.
        }
      }

      try {
        handlerRef.current(getPasteItems(pasteEvent), pasteEvent);
      } catch {
        // The consumer's handler failed. Their problem — and not a reason to break the listener for the next
        // paste, which is what an escaping throw would risk.
      }
    };

    node.addEventListener('paste', listener);
    return () => {
      node.removeEventListener('paste', listener);
    };
  }, [enabled, preventDefault, target]);
}
