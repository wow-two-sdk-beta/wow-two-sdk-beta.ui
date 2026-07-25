// The React binding of the fullscreen vector. No behaviour of its own — the three callbacks delegate, so the
// never-throws contract holds unchanged and every outcome arrives as a `ScreenResult`.
//
// STATE COMES FROM `useSyncExternalStore`, NOT `useState` + an effect. Fullscreen can be left by routes this app
// never sees: the Escape key, the browser's own exit affordance, the OS window manager. A local flag flipped in
// `enter` / `exit` would be wrong the instant the user pressed Escape. The store reads the platform's own
// `fullscreenElement` on every notification, so the component's answer is the document's answer, always. It is
// also the repo's existing idiom for reactive external state (`foundation/hooks`' `useMediaQuery`), and it gives
// SSR a defined `false` with no hydration mismatch.
//
// `supported` is read through the same store rather than computed once. Its value is `false` during SSR and the
// real answer on the client, and routing it through the store is what makes that transition a re-render instead
// of a stale first paint. Both hooks share one `subscribe`, so this costs a second pair of listeners on the same
// two events — the same trade `foundation/device`'s `useDisplayMode` makes with its three media queries.

import { useCallback, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';

import {
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  isFullscreenSupported,
  onFullscreenChange,
  toggleFullscreen,
} from './Fullscreen';
import type { ScreenResult } from './ScreenResult';

/** What {@link useFullscreen} returns. */
export interface FullscreenControls {
  /** Whether anything is currently presented fullscreen — including a transition this hook did not initiate. */
  readonly isFullscreen: boolean;

  /** Whether the Fullscreen API is present. `false` under SSR; render the control only once this is `true`. */
  readonly supported: boolean;

  /** Presents the hook's target fullscreen. Call from a user gesture. Resolves to the result; never throws. */
  readonly enter: () => Promise<ScreenResult>;

  /** Leaves fullscreen. Resolves to `ok` when nothing was presented. Never throws. */
  readonly exit: () => Promise<ScreenResult>;

  /** Exits when presented, enters otherwise. Call from a user gesture. Never throws. */
  readonly toggle: () => Promise<ScreenResult>;
}

/** SSR has no fullscreen element and no API — a defined `false` for both stores, never a throw. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks fullscreen state and exposes the three actions against an optional target.
 *
 * Pass `ref` to present one element (a video, a canvas, a dashboard panel); omit it to present the whole
 * document. The ref is read at call time, so it may still be `null` on the render that wires the handler up.
 *
 * The returned callbacks are stable across renders and inherit the module's never-throws contract.
 *
 * @param ref The element to present. Defaults to `document.documentElement` when omitted or still `null`.
 * @returns The current state plus the `enter` / `exit` / `toggle` actions.
 */
export function useFullscreen(ref?: RefObject<Element | null>): FullscreenControls {
  const subscribe = useCallback((onStoreChange: () => void) => onFullscreenChange(onStoreChange), []);

  const active = useSyncExternalStore(subscribe, isFullscreen, getServerSnapshot);
  const supported = useSyncExternalStore(subscribe, isFullscreenSupported, getServerSnapshot);

  const enter = useCallback(() => enterFullscreen(ref?.current ?? undefined), [ref]);
  const exit = useCallback(() => exitFullscreen(), []);
  const toggle = useCallback(() => toggleFullscreen(ref?.current ?? undefined), [ref]);

  return { isFullscreen: active, supported, enter, exit, toggle };
}
