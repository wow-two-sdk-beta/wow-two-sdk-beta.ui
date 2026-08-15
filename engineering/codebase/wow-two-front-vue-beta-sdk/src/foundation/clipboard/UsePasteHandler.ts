// The Vue binding of the paste path — a `paste` listener with the extraction already done and the teardown
// guaranteed.
//
// WHY A COMPOSABLE RATHER THAN AN `@paste` BINDING. A template `@paste` only fires for a paste into that
// element, which requires it to be focusable and focused. The common feature — "paste a screenshot anywhere on
// this page" — needs a `window` listener, and hand-rolling one means a watcher and a cleanup that people
// forget. Defaulting to `window` and accepting a `target` ref covers both shapes.
//
// The handler is called through the closure rather than captured into the listener, so it can never go stale;
// a component's `setup` runs once, so the one the consumer passes is the one and only. Only `enabled` /
// `target` / `preventDefault` re-run the effect, because only those change what is bound.
//
// SSR: the effect is post-flush, the default target is resolved LAZILY behind a `typeof window` guard, and a
// `target` ref is `null` on the server — so nothing here reaches for `window` during a server render. This is
// the same lazy-default shape `foundation/hooks`' `useEventListener` uses.
//
// A throw from the consumer's handler is swallowed. Inside a native listener a throw does not reject anything —
// it escapes to `window.onerror` and, worse, skips the rest of the listener including a `preventDefault` the
// consumer asked for. Absorbing it keeps the slice's never-throws contract at the one boundary where the
// consumer's own code runs.

import { toValue, watchPostEffect, type MaybeRefOrGetter } from 'vue';

import { getPasteItems, type PasteItems } from './PasteItems';

/** Tunes a {@link usePasteHandler} binding. */
export interface UsePasteHandlerOptions {
  /**
   * The element to listen on. Defaults to `window`, which catches a paste anywhere on the page — the right
   * default for a drop-zone or an editor surface that is not itself focused. Pass a ref or getter to scope the
   * listener to one element.
   */
  readonly target?: MaybeRefOrGetter<HTMLElement | null | undefined>;

  /**
   * Whether the listener is attached. Defaults to `true`; pass `false` to suspend it without tearing down — a
   * modal that should own pastes only while open.
   */
  readonly enabled?: MaybeRefOrGetter<boolean | undefined>;

  /**
   * Whether to call `preventDefault()` on the event, suppressing the browser's own paste. Defaults to `false`.
   *
   * Turn it on when the handler fully owns the paste (inserting the image itself); leave it off when the handler
   * is a side effect and the default insert should still happen. Applied BEFORE the handler runs, so a throw
   * from the handler cannot skip it.
   */
  readonly preventDefault?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * Binds a `paste` listener that hands the handler the event's already-extracted text, HTML, and files.
 *
 * Needs no clipboard permission — see `PasteItems.ts` for why this is the path to prefer over `readText`.
 * Detaches on scope disposal, and on any change to `enabled` / `target` / `preventDefault`.
 *
 * @param handler Called on every paste with the extracted payload and the original event. A throw from it is
 *   swallowed.
 * @param options Where to listen, whether to listen, and whether to suppress the default paste.
 */
export function usePasteHandler(
  handler: (items: PasteItems, event: ClipboardEvent) => void,
  options?: UsePasteHandlerOptions,
): void {
  watchPostEffect((onCleanup) => {
    if ((toValue(options?.enabled) ?? true) === false) return;

    // Resolved lazily and guarded: importing this in an SSR pass must never touch `window`.
    const node: EventTarget | null = toValue(options?.target) ?? (typeof window === 'undefined' ? null : window);
    if (node === null || typeof node.addEventListener !== 'function') return;

    // Captured at attach time so remove uses the same behaviour the listener was bound with.
    const preventDefault = toValue(options?.preventDefault) ?? false;

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
        handler(getPasteItems(pasteEvent), pasteEvent);
      } catch {
        // The consumer's handler failed. Their problem — and not a reason to break the listener for the next
        // paste, which is what an escaping throw would risk.
      }
    };

    node.addEventListener('paste', listener);
    onCleanup(() => node.removeEventListener('paste', listener));
  });
}
