# NotificationCenterGroup

Renders a notification panel — title and count header, a scrolling item list, optional footer.

Source: [NotificationCenterGroup.vue](NotificationCenterGroup.vue).

Public import: `import { NotificationCenterGroup } from '@wow-two-beta/ui-vue/presentation/display';`.

## Contract

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `title` | `string` | no | `'Notifications'` | The header title. Default `"Notifications"`. Rich content → the `title` slot. |
| `count` | `string \| number` | no | — | The badge / count rendered next to the title. Rich content → the `count` slot. |

## Emits

None declared.

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `default` | `default?(): unknown;` | The `NotificationItem` children filling the scrolling list. |
| `title` | `title?(): unknown;` | The header title. Falls back to the `title` prop. |
| `count` | `count?(): unknown;` | The header badge. Falls back to the `count` prop. |
| `headerActions` | `headerActions?(): unknown;` | The controls at the right of the header. |
| `emptyState` | `emptyState?(): unknown;` | Replaces the built-in "all caught up" placeholder shown with no items. |
| `footer` | `footer?(): unknown;` | The footer band under the list. Omitting it drops the band. |

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [FeedbackExamples.ts](../../../../apps/playground/src/gallery/fixtures/FeedbackExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
