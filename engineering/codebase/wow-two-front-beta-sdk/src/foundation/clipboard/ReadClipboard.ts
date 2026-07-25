// Reading the clipboard — the most restricted operation in the slice, and usually the wrong one to reach for.
//
// READ THIS BEFORE USING EITHER FUNCTION. Reading the clipboard is reading a user's data, so browsers gate it far
// harder than writing:
//  - it requires a user gesture, and outside one the platform refuses (`denied`);
//  - Chromium shows an explicit "Allow the site to see text and images on the clipboard?" prompt, and a
//    dismissal is a `denied` — a decision by the user, not a bug to retry;
//  - Firefox does not expose `readText` / `read` to page script at ALL. Only extensions get them. That surfaces
//    here as `unsupported` rather than a generic `failed`, because the two need different UI: `failed` invites a
//    retry, `unsupported` means stop asking and render the manual affordance instead.
//
// IF YOU WANT WHAT THE USER JUST PASTED, DO NOT READ. Handle the `paste` event and call `getPasteItems` — the
// payload arrives on the event, no permission, no prompt, no gesture check, and it works in every engine
// including Firefox. Reading is for the narrow case of pulling the clipboard WITHOUT a paste, like a "detect a
// copied invite code on focus" affordance. That case is rare and worth questioning.
//
// An empty clipboard reads as `''` / `[]` and is a successful read of nothing, not a failure — a consumer
// distinguishes "nothing to paste" from "we could not look" by the status, not by the payload's emptiness.

import {
  reportClipboardOutcome,
  toClipboardFailure,
  type ClipboardReadItem,
  type ClipboardReadItemsResult,
  type ClipboardReadOptions,
  type ClipboardReadTextResult,
} from './ClipboardResult';
import { clipboardMethod } from './ClipboardSupport';

/**
 * Turns one platform `ClipboardItem` into its flat `{ type, blob }` representations.
 *
 * Each type is resolved independently and a type that fails to resolve is SKIPPED rather than failing the read:
 * a clipboard entry carrying `text/plain` plus an exotic type the engine cannot materialize should still yield
 * its text. Never throws.
 */
async function flattenItem(item: ClipboardItem): Promise<ClipboardReadItem[]> {
  const flattened: ClipboardReadItem[] = [];

  let types: readonly string[];
  try {
    const declared: unknown = item.types;
    if (!Array.isArray(declared)) return flattened;
    types = declared as readonly string[];
  } catch {
    return flattened;
  }

  for (const type of types) {
    if (typeof type !== 'string') continue;
    try {
      const blob = await item.getType(type);
      if (typeof blob === 'object' && blob !== null) flattened.push({ type, blob });
    } catch {
      // This representation could not be materialized. The others still can.
    }
  }

  return flattened;
}

/**
 * Reads the clipboard's plain text.
 *
 * Requires a user gesture and, in Chromium, an explicit permission prompt the user can dismiss — a dismissal is
 * `denied`. Resolves to `unsupported` under SSR and in Firefox, which withholds clipboard reading from page
 * script entirely.
 *
 * Prefer `getPasteItems` on a `paste` event wherever the flow is "the user pastes something": that path needs no
 * permission and works everywhere.
 *
 * Never throws, never rejects.
 *
 * @param options Error reporting.
 */
export async function readText(options?: ClipboardReadOptions): Promise<ClipboardReadTextResult> {
  try {
    const read = clipboardMethod('readText');
    if (read === undefined) return { status: 'unsupported' };

    const text = await read();
    return typeof text === 'string'
      ? { status: 'read', text }
      : reportClipboardOutcome(
          {
            status: 'failed',
            error: new TypeError('navigator.clipboard.readText resolved with a non-string.'),
          } as const,
          options?.onError,
        );
  } catch (error) {
    return reportClipboardOutcome(toClipboardFailure(error), options?.onError);
  }
}

/**
 * Reads every representation currently on the clipboard — the multi-format counterpart of {@link readText}, and
 * the only way to pull a copied image.
 *
 * Same gating as {@link readText}, and narrower support still: `navigator.clipboard.read` postdates `readText`
 * in every engine that has it. Representations the platform cannot materialize are dropped from the result
 * rather than failing the whole read.
 *
 * Never throws, never rejects.
 *
 * @param options Error reporting.
 */
export async function readItems(options?: ClipboardReadOptions): Promise<ClipboardReadItemsResult> {
  try {
    const read = clipboardMethod('read');
    if (read === undefined) return { status: 'unsupported' };

    const raw: unknown = await read();
    if (!Array.isArray(raw)) {
      return reportClipboardOutcome(
        { status: 'failed', error: new TypeError('navigator.clipboard.read resolved with a non-array.') } as const,
        options?.onError,
      );
    }

    const items: ClipboardReadItem[] = [];
    for (const entry of raw as readonly ClipboardItem[]) {
      if (typeof entry !== 'object' || entry === null) continue;
      items.push(...(await flattenItem(entry)));
    }

    return { status: 'read', items };
  } catch (error) {
    return reportClipboardOutcome(toClipboardFailure(error), options?.onError);
  }
}
