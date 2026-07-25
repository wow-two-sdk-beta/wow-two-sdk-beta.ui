// The permission read — thin on purpose, and less useful than it looks.
//
// It delegates to `foundation/notifications`' `queryPermission`, which already wraps `navigator.permissions`
// with exactly the guards this needs: absent API, an unknown permission name (Safari THROWS synchronously rather
// than resolving), and an off-spec state string. Duplicating that here would be a second copy of a subtle
// wrapper. The import is a deep one rather than the notifications barrel so this slice does not pull that
// slice's React hooks and `Notification` plumbing into the clipboard bundle.
//
// WHY `unsupported` IS THE COMMON ANSWER. `clipboard-read` and `clipboard-write` are not universally implemented
// permission NAMES: Chromium has both, Firefox has neither, Safari rejects them. So this returns `unsupported`
// on most of the web — which means "we could not ask", NOT "the operation will fail". Firefox writes to the
// clipboard perfectly well while reporting `unsupported` here.
//
// CONSEQUENCE FOR CALLERS: do not gate a copy button on this. Attempt the write and branch on its result — the
// operation is the only honest test of whether it is allowed. This helper is for the narrow case of rendering a
// pre-emptive explanation where the answer happens to be known (a Chromium-only internal tool, a "we will ask
// for clipboard access" notice before a paste-detection feature).

import { queryPermission, type PermissionQueryState } from '../notifications/QueryPermission';

/** Which half of the clipboard a permission query is about. */
export type ClipboardPermissionMode = 'read' | 'write';

/** The Permissions API names, which differ from this slice's vocabulary and are not implemented everywhere. */
const PermissionNames: Readonly<Record<ClipboardPermissionMode, string>> = {
  read: 'clipboard-read',
  write: 'clipboard-write',
};

/**
 * Reads the browser's recorded permission for clipboard reading or writing.
 *
 * Returns `unsupported` wherever the Permissions API is absent or does not implement the name — which is most
 * browsers, including all of Firefox and Safari. Read that as "unknown", never as "denied": the capability is
 * frequently available where the QUERY is not.
 *
 * A one-shot snapshot; the browser fires no event on this promise.
 *
 * Never throws, never rejects.
 *
 * @param mode `'read'` for `clipboard-read`, `'write'` for `clipboard-write`.
 */
export async function getClipboardPermission(mode: ClipboardPermissionMode): Promise<PermissionQueryState> {
  const name = PermissionNames[mode];
  if (name === undefined) return 'unsupported';
  return queryPermission(name);
}
