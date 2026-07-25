// notifications — foundation seam. The OS-level Web Notification vector: `getNotificationPermission` /
// `requestNotificationPermission` (the grant), `canNotify` (capability), `notify` (delivery, four typed
// outcomes, auto-close + click convenience), `queryPermission` (the generic Permissions API read), and the two
// React bindings `useNotificationPermission` / `usePermissionState`. No HTTP, no components — an "Enable
// notifications" button is a consumer of these rules, not their owner; React appears only in the two `Use*`
// modules.
//
// SCOPE BOUNDARY — this is NOT the in-app toast system. `notify` here calls the browser's `Notification`
// constructor: the OS-drawn banner the user sees while the tab is in the BACKGROUND, gated behind a permission
// prompt, drawn by the operating system outside the page. Nothing in this slice renders anything in the
// document.
//   - In-app notices (the headless bus a component publishes to) → `@wow-two-beta/ui/feedback` (`src/feedback/`).
//   - The in-app toast UI that renders them → `presentation/feedback`'s `Toaster`
//     (`src/presentation/feedback/toaster/`).
//   - The in-page notification list / bell → `presentation/feedback`'s `NotificationCenter`. Named the closest
//     to this slice and related to it least: it is a rendered component, not a platform API.
// The two are complementary, not alternatives: an in-app toast is invisible to a user who is not looking at the
// tab, and an OS notification is intrusive for something an on-screen user can already see. A consumer that
// wants "toast when focused, OS notification when not" composes both — this slice neither wraps, re-exports,
// nor depends on either of them.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. Every entry point is invoked from a click handler or an effect and
// answers with a value — a state, a boolean, or a discriminated result — instead of throwing or rejecting, so a
// consumer never needs a `try` around a notification. `unsupported` is a first-class member of both unions
// rather than an error: SSR, an older Safari, and a browser with the API behind a flag are ordinary conditions
// a UI has to render, not exceptions to handle.
//
// Two permission APIs, on purpose. `Notification.permission` is authoritative for the grant but fires no event;
// `navigator.permissions.query('notifications')` fires the event but speaks its own vocabulary and is absent on
// older Safari. So `useNotificationPermission` reads the first and merely listens to the second.

export {
  type NotificationPermissionState,
  getNotificationPermission,
  requestNotificationPermission,
} from './NotificationPermission';

export { canNotify } from './CanNotify';

export { notify, type NotifyOptions, type NotifyResult, type NotifyStatus } from './Notify';

export { queryPermission, type PermissionQueryName, type PermissionQueryState } from './QueryPermission';

export { usePermissionState } from './UsePermissionState';

export { useNotificationPermission, type NotificationPermissionControls } from './UseNotificationPermission';
