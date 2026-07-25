// The plain-text write — the one every "copy link" / "copy code" button wants, and the slice's most-used entry
// point.
//
// The whole body sits inside a `try`, not only the `await`. `navigator.clipboard.writeText` can throw
// synchronously rather than reject (a partial implementation, a polyfill, an extension patching the method), and
// a synchronous throw would escape an `await`-only guard and reach the consumer's click handler as an unhandled
// error — the exact failure mode the never-throws contract exists to prevent.
//
// A non-string `text` is answered, not coerced. The signature says `string`, so a non-string only arrives from
// untyped JavaScript, and coercing it is a guess: `String(value)` on a `Symbol` throws, and on an object it
// silently copies "[object Object]" to the user's clipboard — a wrong success is worse than a typed failure.

import {
  reportClipboardOutcome,
  toClipboardFailure,
  type ClipboardCopyOptions,
  type ClipboardWriteResult,
} from './ClipboardResult';
import { clipboardMethod } from './ClipboardSupport';
import { withLegacyFallback } from './LegacyCopy';

/** Runs the Clipboard API write, mapping every outcome onto the result union. Never throws. */
async function writeTextThroughApi(text: string): Promise<ClipboardWriteResult> {
  const writeText = clipboardMethod('writeText');
  if (writeText === undefined) return { status: 'unsupported' };

  try {
    await writeText(text);
    return { status: 'copied' };
  } catch (error) {
    return toClipboardFailure(error);
  }
}

/**
 * Writes `text` to the system clipboard.
 *
 * Call it from a user gesture: browsers require transient activation for a clipboard write, and without one the
 * platform refuses — which surfaces as `denied`, not `unsupported`, since the API was in fact present.
 *
 * Resolves to `unsupported` under SSR, in a non-secure context, and on engines with no Clipboard API. Pass
 * `legacyFallback: true` to retry those through the deprecated `document.execCommand` path.
 *
 * Never throws, never rejects.
 *
 * @param text The text to place on the clipboard. An empty string is a valid payload — it clears the clipboard.
 * @param options Error reporting and the legacy-fallback opt-in.
 */
export async function copyText(text: string, options?: ClipboardCopyOptions): Promise<ClipboardWriteResult> {
  try {
    if (typeof text !== 'string') {
      return reportClipboardOutcome(
        { status: 'failed', error: new TypeError('copyText expects a string.') } as const,
        options?.onError,
      );
    }

    const result = withLegacyFallback(await writeTextThroughApi(text), text, options);
    return reportClipboardOutcome(result, options?.onError);
  } catch (error) {
    // Unreachable by design — every helper above is itself total. Kept so a future edit to one of them cannot
    // turn this entry point into a rejecting promise.
    return reportClipboardOutcome(toClipboardFailure(error), options?.onError);
  }
}
