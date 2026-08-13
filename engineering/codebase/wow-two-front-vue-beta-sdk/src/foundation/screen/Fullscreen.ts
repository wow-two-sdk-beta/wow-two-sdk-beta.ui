// The Fullscreen API, made total. Enter / exit / toggle / read, each resolving to a `ScreenResult`.
//
// WEBKIT PREFIXES ARE NOT LEGACY CRUFT. Safari has never shipped the unprefixed names on all its surfaces —
// `webkitRequestFullscreen`, `webkitFullscreenElement`, `webkitExitFullscreen`, and the `webkitfullscreenchange`
// event are still the live path there. So every accessor tries the standard member first and falls back to the
// prefixed one, and `onFullscreenChange` subscribes to BOTH events: a browser that fires only one is the normal
// case, and a browser firing both merely calls an idempotent snapshot read twice.
//
// WHY A REJECTION IS CLASSIFIED RATHER THAN REPORTED: `requestFullscreen` rejects for two very different
// reasons that the platform reports almost identically. The common one by far is a missing user gesture — the
// call escaped its click handler, or an `await` landed before it and spent the transient activation. That is a
// developer error with a mechanical fix, and it must not read the same as "this browser cannot do fullscreen".
// The spec rejects the activation case with a `TypeError`, whereas operational failures arrive as `DOMException`s
// with a name, so the type itself carries most of the signal; the message pattern is checked first because it is
// the only thing that survives a browser choosing a different type.
//
// KNOWN AMBIGUITY, deliberately resolved toward the common case: a permissions-policy block (an iframe without
// `allow="fullscreen"`) also rejects with a `TypeError` in Chromium, so it lands on `requires-gesture` too.
// Distinguishing them would take reading `document.featurePolicy`, which is non-standard and absent in Safari.
// Since both are fixed by the embedder rather than at runtime, and the gesture case is overwhelmingly more
// frequent, the mapping favours it — and the original error rides along on the result for anyone who needs more.
//
// `document.fullscreenEnabled` is NOT used as the support check. It reports the permissions-policy answer, not
// the API's presence, so a `false` there would make the whole slice claim `unsupported` in an iframe where the
// call might still be worth attempting. Method presence is the honest question for "is this API here".

import { toError } from '../errors';

import { getDocument, isFunction, readMember } from './ScreenEnvironment';
import type { ScreenFailure, ScreenResult } from './ScreenResult';

/** Matches how browsers word an activation failure — checked before the error's type, which browsers vary on. */
const GestureRejectionPattern = /user (?:gesture|activation)|transient activation|user-activation/i;

/** A fullscreen request or exit, as the platform exposes it. Safari's prefixed form returns `undefined`, not a promise. */
type FullscreenCall = (this: unknown) => Promise<void> | void;

/** Sorts a rejected fullscreen call into the slice's vocabulary — see this file's header for the reasoning. */
function classifyFullscreenRejection(cause: unknown): ScreenFailure {
  const error = toError(cause);

  if (GestureRejectionPattern.test(error.message)) return { status: 'requires-gesture', error };
  // The spec's activation rejection. `DOMException`s (which carry a `name`) fall through to the checks below.
  if (error.name === 'TypeError') return { status: 'requires-gesture', error };
  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return { status: 'denied', error };

  return { status: 'failed', error };
}

/** Picks the standard member off `source`, falling back to its WebKit-prefixed twin. */
function pickPrefixed(source: unknown, standard: string, prefixed: string): FullscreenCall | undefined {
  const method = readMember(source, standard) ?? readMember(source, prefixed);
  return isFunction(method) ? (method as FullscreenCall) : undefined;
}

/**
 * The element currently presented fullscreen, or `null` when nothing is.
 *
 * Reads the standard `document.fullscreenElement` first and Safari's `webkitFullscreenElement` second. Returns
 * `null` under SSR.
 *
 * @returns The fullscreen element, or `null`.
 */
export function getFullscreenElement(): Element | null {
  const doc = getDocument();
  if (doc === undefined) return null;

  const standard = readMember(doc, 'fullscreenElement');
  if (standard !== null && standard !== undefined) return standard as Element;

  const prefixed = readMember(doc, 'webkitFullscreenElement');
  if (prefixed !== null && prefixed !== undefined) return prefixed as Element;

  return null;
}

/**
 * Whether anything is currently presented fullscreen.
 *
 * A point-in-time read, not a subscription — `useFullscreen` is the reactive form. Returns `false` under SSR.
 *
 * @returns `true` when a fullscreen element is present.
 */
export function isFullscreen(): boolean {
  return getFullscreenElement() !== null;
}

/**
 * Whether the Fullscreen API is present at all.
 *
 * Answers presence, not permission: an iframe lacking `allow="fullscreen"` still reports `true` here, and its
 * request resolves to a non-`ok` status instead. Returns `false` under SSR. See this file's header for why
 * `document.fullscreenEnabled` is not consulted.
 *
 * @returns `true` when a fullscreen request could be attempted.
 */
export function isFullscreenSupported(): boolean {
  const doc = getDocument();
  if (doc === undefined) return false;

  const root = readMember(doc, 'documentElement');
  return isFunction(readMember(root, 'requestFullscreen')) || isFunction(readMember(root, 'webkitRequestFullscreen'));
}

/**
 * Presents `element` fullscreen, defaulting to the document root.
 *
 * CALL THIS FROM A USER GESTURE. Browsers require transient activation, and a call that has lost it — because it
 * sits outside a click handler, or because an `await` preceded it — resolves to `requires-gesture`, not `failed`.
 *
 * Never throws, never rejects.
 *
 * @param element The element to present. Defaults to `document.documentElement`.
 * @returns `ok` once the platform accepts the request, or the classified failure.
 */
export async function enterFullscreen(element?: Element): Promise<ScreenResult> {
  const doc = getDocument();
  if (doc === undefined) return { status: 'unsupported' };

  const target = element ?? (readMember(doc, 'documentElement') as Element | null | undefined);
  if (target === null || target === undefined) return { status: 'unsupported' };

  const request = pickPrefixed(target, 'requestFullscreen', 'webkitRequestFullscreen');
  if (request === undefined) return { status: 'unsupported' };

  try {
    // `await` on Safari's `undefined` return is a no-op, which is exactly the intended "already done" semantic.
    await request.call(target);
    return { status: 'ok' };
  } catch (error) {
    return classifyFullscreenRejection(error);
  }
}

/**
 * Leaves fullscreen.
 *
 * Idempotent: exiting when nothing is fullscreen resolves to `ok` rather than surfacing the `TypeError` browsers
 * reject that call with. A caller unwinding its own state should not have to check first.
 *
 * Never throws, never rejects.
 *
 * @returns `ok` once the document is out of fullscreen, or the classified failure.
 */
export async function exitFullscreen(): Promise<ScreenResult> {
  const doc = getDocument();
  if (doc === undefined) return { status: 'unsupported' };

  const exit = pickPrefixed(doc, 'exitFullscreen', 'webkitExitFullscreen');
  if (exit === undefined) return { status: 'unsupported' };

  if (getFullscreenElement() === null) return { status: 'ok' };

  try {
    await exit.call(doc);
    return { status: 'ok' };
  } catch (error) {
    return classifyFullscreenRejection(error);
  }
}

/**
 * Exits fullscreen when something is presented, enters with `element` otherwise.
 *
 * Inherits {@link enterFullscreen}'s gesture requirement on the entering leg. Never throws, never rejects.
 *
 * @param element The element to present when entering. Defaults to `document.documentElement`.
 * @returns The result of whichever leg ran.
 */
export function toggleFullscreen(element?: Element): Promise<ScreenResult> {
  return isFullscreen() ? exitFullscreen() : enterFullscreen(element);
}

/**
 * Subscribes `listener` to fullscreen transitions, returning an unsubscribe.
 *
 * Listens on both `fullscreenchange` and `webkitfullscreenchange`, so a browser on either spelling is covered.
 * A browser firing both invokes `listener` twice per transition — harmless for the snapshot reads this exists to
 * drive, but do not use it to count transitions.
 *
 * Returns a no-op unsubscribe under SSR, so a caller never needs to branch on the environment.
 *
 * @param listener Invoked after every fullscreen transition.
 * @returns A function that removes both listeners.
 */
export function onFullscreenChange(listener: () => void): () => void {
  const doc = getDocument();
  if (doc === undefined || !isFunction(readMember(doc, 'addEventListener'))) {
    return () => {
      // No DOM to unsubscribe from. A no-op keeps the caller's teardown path uniform.
    };
  }

  const handler = (): void => {
    listener();
  };

  doc.addEventListener('fullscreenchange', handler);
  doc.addEventListener('webkitfullscreenchange', handler);

  return () => {
    doc.removeEventListener('fullscreenchange', handler);
    doc.removeEventListener('webkitfullscreenchange', handler);
  };
}
