// The graceful-degradation half of the share vector. Web Share is mobile-first — most desktop browsers have no
// sheet at all — so a share button wired only to `share` is dead UI for a large share of traffic. The fallback
// puts the payload's text on the clipboard instead, which is what the user reaches for next anyway.
//
// Only `unsupported` falls back, and the exclusions are the whole point:
//   - `dismissed` must NOT copy. The user opened the sheet and closed it; that is a decision not to share.
//     Writing to their clipboard anyway overrides that decision and clobbers whatever they had on it.
//   - `failed` must NOT copy either — the platform tried and broke, and a copy would report success for a
//     share that did not happen.
//
// Clipboard writing: `foundation/hooks`' `useClipboard` owns the React-side copy (transient `copied` flag,
// auto-reset), but it is a hook and cannot be called from this async, render-free path — and its `copy` resolves
// either way, folding failure into React state that a non-React caller cannot read. So the write here goes
// straight to `navigator.clipboard.writeText`, guarded exactly as the rest of the slice guards `navigator`.
// Consumers wanting the transient flag compose `useClipboard` themselves, or read `useShare().copied`.

import { toError } from '../errors';

import { reportShareError, share, type ShareOptions, type ShareResult } from './Share';
import { shareFallbackText, type ShareData } from './ShareData';

/** A {@link ShareResult} widened with the clipboard-fallback outcome. */
export type ShareOrCopyResult = ShareResult | { readonly status: 'copied' };

/** The `status` discriminant of a {@link ShareOrCopyResult}. */
export type ShareOrCopyStatus = ShareOrCopyResult['status'];

/** Tunes a share-with-fallback attempt. */
export interface ShareOrCopyOptions extends ShareOptions {
  /**
   * Whether an `unsupported` share degrades to a clipboard copy. Defaults to `true`; pass `false` to keep the
   * `unsupported` result and render your own affordance instead (an explicit copy button, a mailto link).
   */
  readonly fallbackToCopy?: boolean;
}

/** Writes `text` to the system clipboard, mapping the outcome onto the share result vocabulary. Never throws. */
async function copyToClipboard(text: string, options?: ShareOptions): Promise<ShareOrCopyResult> {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
      return { status: 'unsupported' };
    }

    await navigator.clipboard.writeText(text);
    return { status: 'copied' };
  } catch (error) {
    // A rejected write is a real failure (denied permission, insecure context): the user asked to share and
    // nothing reached them. Reported rather than quietly downgraded to `unsupported`.
    const failure = toError(error);
    reportShareError(options?.onError, failure);
    return { status: 'failed', error: failure };
  }
}

/**
 * Shares `data` natively, falling back to a clipboard copy of its `shareFallbackText` when there is no Web Share
 * API. Resolves to `copied` when the fallback ran.
 *
 * Falls back on `unsupported` only — `shared` / `dismissed` / `failed` pass straight through. Stays
 * `unsupported` when `fallbackToCopy` is `false`, when the payload has no copyable text (files only), or when
 * the clipboard is unavailable too.
 *
 * Never throws, never rejects.
 */
export async function shareOrCopy(data: ShareData, options?: ShareOrCopyOptions): Promise<ShareOrCopyResult> {
  const result = await share(data, options);
  if (result.status !== 'unsupported') return result;
  if (options?.fallbackToCopy === false) return result;

  const text = shareFallbackText(data);
  if (text === undefined) return result;

  return copyToClipboard(text, options);
}
