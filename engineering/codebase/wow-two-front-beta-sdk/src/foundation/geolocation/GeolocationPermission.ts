// The permission read — deliberately a one-line delegation, not an implementation.
//
// `foundation/notifications` already owns the `navigator.permissions.query` wrapper, and it was written
// generically precisely so this slice would not need a second one: it already handles the API being absent
// (SSR, older Safari), Safari throwing synchronously for a name it does not implement, and an off-spec state
// string — all collapsing to `unsupported`. Re-implementing that here would give the ecosystem two wrappers
// that drift apart, and a `geolocation` permission read that behaves subtly differently from a `notifications`
// one for no reason a consumer could predict.
//
// Its home in `notifications` is historical, not semantic: notifications are the one permission needing BOTH
// the Permissions API and a second, notification-specific source, so the generic wrapper was written there
// first. Nothing about it is notification-specific — its own header says so.
//
// THIS IS A READ, NOT A REQUEST. Geolocation has no `requestPermission()`; the only way to raise the prompt is
// to ask for a position. So the flow is: `getGeolocationPermission()` to decide what to render (`prompt` → show
// the button, `denied` → show the "enable it in settings" copy), then `getCurrentPosition()` to actually ask.
//
// `unsupported` is not `prompt`. Where the Permissions API is missing, the grant is simply unknown — and a
// consumer must not read "we could not tell" as "the user has not been asked yet". Geolocation itself may well
// be present and working there; `canLocate()` is the capability question, this is the grant question.

import { queryPermission, type PermissionQueryState } from '../notifications';

export type { PermissionQueryState };

/**
 * Reads the current geolocation grant without prompting for it.
 *
 * A snapshot — the returned promise fires no event on a later change. Use `usePermissionState('geolocation')`
 * from `foundation/notifications` to follow changes (a revoke from site settings, a grant given in another tab).
 *
 * Never throws, never rejects.
 *
 * @returns `granted` / `denied` / `prompt`, or `unsupported` where the Permissions API cannot answer.
 */
export function getGeolocationPermission(): Promise<PermissionQueryState> {
  return queryPermission('geolocation');
}
