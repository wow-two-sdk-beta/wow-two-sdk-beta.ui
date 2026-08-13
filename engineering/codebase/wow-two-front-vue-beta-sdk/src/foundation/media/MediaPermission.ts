// Permission reads for the two capture devices — two one-line delegations to `foundation/notifications`'
// `queryPermission`, and no second Permissions API wrapper.
//
// That slice owns the generic `navigator.permissions.query` seam (its name is about where it was first needed,
// not what it covers): the guarded `navigator.permissions` read, the off-spec-state handling, and the
// synchronous-throw case all already live there and are already tested. Re-implementing them here would produce
// a second thing to keep correct and a second place to fix a browser quirk. These functions exist only to pin
// the two permission names so a consumer cannot typo `'microfone'` into an `unsupported` it will never explain.
//
// WHY THIS IS NOT THE GRANT CHECK. `queryPermission('camera')` answers `prompt` in the ordinary case, and on
// Firefox answers `unsupported` for both names — Firefox throws a `TypeError` for camera / microphone rather
// than resolving. So it can tell you the user has already BLOCKED the camera (worth rendering: re-prompting is
// futile, the fix is in site settings), and it can never tell you a request will succeed. The authoritative
// answer is `requestCameraStream`'s own result. Treat this as a hint that improves copy, never as a gate.

import { queryPermission, type PermissionQueryState } from '../notifications';

/**
 * The state of a queried permission — re-exported from `foundation/notifications` so a consumer of this slice
 * can name the return type without importing a second subpath.
 */
export type { PermissionQueryState };

/**
 * Reads the camera permission's current state without prompting.
 *
 * A hint, not a gate — see the module header. `unsupported` is the normal Firefox answer and means "cannot
 * tell", never "blocked". Never throws, never rejects.
 *
 * @returns `granted` · `denied` · `prompt` · `unsupported`.
 */
export function getCameraPermission(): Promise<PermissionQueryState> {
  return queryPermission('camera');
}

/**
 * Reads the microphone permission's current state without prompting.
 *
 * Same caveats as {@link getCameraPermission}. Never throws, never rejects.
 *
 * @returns `granted` · `denied` · `prompt` · `unsupported`.
 */
export function getMicrophonePermission(): Promise<PermissionQueryState> {
  return queryPermission('microphone');
}
