# ToastHost

Renders a `ToastNode` — either a plain string or a caller-built VNode.

Source: [ToastHost.vue](ToastHost.vue).

Public import: `import { ToastHost } from '@wow-two-beta/ui-vue/presentation/feedback';`.

## Contract

- Hover and descendant keyboard focus independently pause expiration; expiration resumes only when both have left.
- `toastHost.promise` returns the full settlement chain, preserving resolved values and rejected reasons. Content formatter failures reject that returned promise.
- Dismissal updates subscribers even if an `onDismiss` callback throws; callers still receive that callback error.
- `showProgress` draws a countdown bar on each auto-dismissing toast; a toast's `progress` option overrides it. The bar pauses and resumes with the expiry timer, restarts when the toast updates in place, takes the severity colour (brand primary when neutral), and is omitted for sticky toasts and under reduced motion.

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop              | Type              | Required | Default                            | Meaning                                                                                                    |
| ----------------- | ----------------- | -------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `position`        | `OverlayPosition` | no       | `OverlayPositionToken.BottomRight` | Declared by the source contract.                                                                           |
| `max`             | `number`          | no       | `5`                                | Declared by the source contract.                                                                           |
| `defaultDuration` | `number`          | no       | `5000`                             | The default auto-dismiss delay in ms; per-toast `duration` overrides. Default 5000. `Infinity` to disable. |
| `canPauseOnHover` | `boolean`         | no       | `true`                             | Declared by the source contract.                                                                           |
| `gap`             | `number`          | no       | `8`                                | Declared by the source contract.                                                                           |
| `showProgress`    | `boolean`         | no       | `false`                            | Shows a countdown bar on auto-dismissing toasts; per-toast `progress` overrides it.                        |

## Emits

None declared.

## Slots

None declared.

## Exposed handle

No explicit exposed handle.

## Verification

- Public render fixture: [FeedbackExamples.ts](../../../../apps/playground/src/gallery/fixtures/FeedbackExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
