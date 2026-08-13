// The deprecated write path: a hidden `<textarea>`, selected, copied with `document.execCommand('copy')`, and
// removed. Opt-in only, via `legacyFallback: true`.
//
// WHY IT EXISTS AT ALL. `navigator.clipboard` requires a secure context. Any page served over plain HTTP — a LAN
// tool, a staging box on an IP address, an embedded device's admin UI — has no Clipboard API whatsoever, and
// neither does Safari before 13.1. In those places `execCommand` is not the worse option, it is the only one.
//
// WHY IT IS OPT-IN. `document.execCommand` is deprecated: removed from the standard, kept alive by web
// compatibility, and free to disappear from any engine. It is also synchronous and re-entrant into layout, which
// makes it a jank source on a large payload. A consumer should choose that trade, not inherit it.
//
// THE ELEMENT IS ALWAYS REMOVED. Removal is in a `finally`, not on the success path — if `execCommand` throws
// (a hardened page, an extension patching it), an early `return` would leave a focus-stealing textarea in the
// DOM forever, and every retry would leave another. The same `finally` restores focus to whatever had it, since
// selecting the textarea takes focus away from the button the user just clicked and losing it mid-interaction
// strands a keyboard user.
//
// The textarea is positioned rather than `display: none` / `hidden`: an element outside the layout tree cannot
// be selected, and an unselected textarea copies nothing.

import { toClipboardFailure, type ClipboardCopyOptions, type ClipboardWriteResult } from './ClipboardResult';
import { canLegacyCopy } from './ClipboardSupport';

/** Off-screen but laid out — selection requires a rendered element, so `display: none` would copy nothing. */
const HiddenTextareaCss =
  'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;margin:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;pointer-events:none;';

/** Restores focus to whatever held it before the textarea took it. Guarded — a stand-in may have no `focus`. */
function restoreFocus(previous: Element | null): void {
  try {
    if (previous === null) return;
    const focus = (previous as { focus?: unknown }).focus;
    if (typeof focus !== 'function') return;
    (previous as HTMLElement).focus({ preventScroll: true });
  } catch {
    // The previously focused element is gone or refuses focus. Not worth failing a completed copy over.
  }
}

/** Detaches the temporary textarea, preferring `remove()` and falling back to the parent. Never throws. */
function detach(element: HTMLTextAreaElement): void {
  try {
    if (typeof element.remove === 'function') {
      element.remove();
      return;
    }
    element.parentNode?.removeChild(element);
  } catch {
    // Nothing further to try. The failure to detach must not mask the copy's own result.
  }
}

/**
 * Copies `text` through the deprecated `document.execCommand('copy')` path.
 *
 * Synchronous, unlike every other write in this slice — `execCommand` is. Requires a user gesture: outside one
 * the command reports its own refusal by returning `false`, which surfaces here as `failed` (the legacy API has
 * no way to say "denied" specifically). Returns `unsupported` under SSR or where `execCommand` is gone.
 *
 * Exported for the sibling modules and for a consumer that wants the legacy path explicitly; the temporary
 * element is removed on every path, including a throw from `execCommand` itself.
 *
 * Never throws.
 *
 * @param text The text to place on the clipboard.
 * @deprecated Prefer `copyText`, which uses the Clipboard API and falls back here only on `legacyFallback: true`.
 */
export function legacyCopyText(text: string): ClipboardWriteResult {
  if (!canLegacyCopy()) return { status: 'unsupported' };

  let element: HTMLTextAreaElement | undefined;
  let previouslyFocused: Element | null = null;

  try {
    const body: unknown = document.body;
    if (typeof body !== 'object' || body === null) return { status: 'unsupported' };

    previouslyFocused = document.activeElement;

    element = document.createElement('textarea');
    element.value = text;
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('tabindex', '-1');
    element.setAttribute('readonly', 'readonly');
    element.style.cssText = HiddenTextareaCss;

    (body as HTMLElement).appendChild(element);

    element.focus({ preventScroll: true });
    element.select();
    element.setSelectionRange(0, text.length);

    const copied = document.execCommand('copy');
    return copied
      ? { status: 'copied' }
      : { status: 'failed', error: new Error('document.execCommand("copy") reported failure.') };
  } catch (error) {
    return toClipboardFailure(error);
  } finally {
    if (element !== undefined) detach(element);
    restoreFocus(previouslyFocused);
  }
}

/**
 * Retries a write that the Clipboard API could not complete through the legacy path, when the caller opted in.
 *
 * The retry runs whenever `modern` is not `copied` — not only on `unsupported`. A `denied` from
 * `navigator.clipboard` is exactly the case `execCommand` can still serve: the legacy command is gated on the
 * user gesture the call already sits in, not on the Clipboard API's permission.
 *
 * Which result wins:
 *  - the legacy attempt, when it copied — a success outranks any diagnosis;
 *  - otherwise `modern`, when the Clipboard API was actually present (its `denied` / `failed` is the more
 *    specific account of what went wrong);
 *  - otherwise the legacy attempt's own result — with no Clipboard API at all, `modern` is a bare `unsupported`
 *    and the legacy failure says more.
 *
 * Exported for the sibling write modules; absent from the barrel. Never throws.
 *
 * @param modern The result the Clipboard API path produced.
 * @param text The plain-text payload, or `undefined` when the write has no text arm to degrade to.
 * @param options The caller's options — the retry runs only on `legacyFallback: true`.
 */
export function withLegacyFallback(
  modern: ClipboardWriteResult,
  text: string | undefined,
  options: ClipboardCopyOptions | undefined,
): ClipboardWriteResult {
  if (modern.status === 'copied') return modern;
  if (options?.legacyFallback !== true) return modern;
  if (text === undefined) return modern;

  const legacy = legacyCopyText(text);
  if (legacy.status === 'copied') return legacy;
  return modern.status === 'unsupported' ? legacy : modern;
}
