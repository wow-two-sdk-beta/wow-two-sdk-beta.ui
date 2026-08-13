// Feature detection for the notification vector. Unlike `foundation/share`'s `canShare`, availability alone is
// not the question: an origin can have the whole API and still be unable to show anything, because the user
// never answered the prompt or refused it. So the check is the conjunction — API present AND grant held — and
// the two halves stay separable through `getNotificationPermission`, whose `default` vs `denied` vs
// `unsupported` distinction is what a consumer needs to decide between an enable button, a settings hint, and
// hiding the feature entirely.

import { getNotificationPermission } from './NotificationPermission';

/**
 * Whether `notify` would actually show something right now: the Notification API exists and this origin holds
 * the grant.
 *
 * Returns `false` under SSR, on a non-supporting browser, and — importantly — on a supporting browser that has
 * simply not been asked yet. A `false` here is therefore not a reason to hide the feature; check
 * `getNotificationPermission() === 'default'` first and offer the prompt.
 *
 * Never throws.
 */
export function canNotify(): boolean {
  return getNotificationPermission() === 'granted';
}
