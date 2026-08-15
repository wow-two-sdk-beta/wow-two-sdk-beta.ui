// The Vue binding of the fullscreen vector. No behaviour of its own — the three actions delegate, so the
// never-throws contract holds unchanged and every outcome arrives as a `ScreenResult`.
//
// STATE IS A SUBSCRIPTION, NOT A LOCAL FLAG. Fullscreen can be left by routes this app never sees: the Escape
// key, the browser's own exit affordance, the OS window manager. A flag flipped in `enter` / `exit` would be
// wrong the instant the user pressed Escape. The subscription re-reads the platform's own `fullscreenElement` on
// every notification, so the component's answer is the document's answer, always. This is the Vue counterpart of
// the original's `useSyncExternalStore` and the same shape as `foundation/hooks`' `useMediaQuery`: seed `false`,
// subscribe in `onMounted`, unsubscribe in `onScopeDispose`.
//
// SEEDING `false` RATHER THAN READING AT SETUP IS THE SSR RULE, not a nicety: `isFullscreen` and
// `isFullscreenSupported` both read `document`, which does not exist on the server. `onMounted` is client-only by
// construction, so the server pass answers `false` for both and the truth lands at hydration with no mismatch.
//
// `supported` rides the same subscription rather than being computed once — one pair of listeners drives both
// values, the same trade `foundation/device`'s `useDisplayMode` makes with its media queries.

import { onMounted, onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter, type ShallowRef } from 'vue';

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
  /** Whether anything is currently presented fullscreen — including a transition this composable did not initiate. */
  readonly isFullscreen: Readonly<ShallowRef<boolean>>;

  /** Whether the Fullscreen API is present. `false` under SSR; render the control only once this is `true`. */
  readonly supported: Readonly<ShallowRef<boolean>>;

  /** Presents the composable's target fullscreen. Call from a user gesture. Resolves to the result; never throws. */
  readonly enter: () => Promise<ScreenResult>;

  /** Leaves fullscreen. Resolves to `ok` when nothing was presented. Never throws. */
  readonly exit: () => Promise<ScreenResult>;

  /** Exits when presented, enters otherwise. Call from a user gesture. Never throws. */
  readonly toggle: () => Promise<ScreenResult>;
}

/**
 * Tracks fullscreen state and exposes the three actions against an optional target.
 *
 * Pass `target` to present one element (a video, a canvas, a dashboard panel); omit it to present the whole
 * document. Takes the element as a ref or getter rather than handing one back, so a `useTemplateRef` drops
 * straight in — and it is read at call time, so it may still be `null` when the handler is wired up.
 *
 * Inherits the module's never-throws contract.
 *
 * @param target The element to present. Defaults to `document.documentElement` when omitted or still `null`.
 * @returns The current state plus the `enter` / `exit` / `toggle` actions.
 */
export function useFullscreen(target?: MaybeRefOrGetter<Element | null | undefined>): FullscreenControls {
  const active = shallowRef(false);
  const supported = shallowRef(false);

  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    const sync = (): void => {
      active.value = isFullscreen();
      supported.value = isFullscreenSupported();
    };
    sync();
    unsubscribe = onFullscreenChange(sync);
  });

  onScopeDispose(() => {
    unsubscribe?.();
    unsubscribe = undefined;
  });

  const enter = (): Promise<ScreenResult> => enterFullscreen(toValue(target) ?? undefined);
  const exit = (): Promise<ScreenResult> => exitFullscreen();
  const toggle = (): Promise<ScreenResult> => toggleFullscreen(toValue(target) ?? undefined);

  return { isFullscreen: active, supported, enter, exit, toggle };
}
