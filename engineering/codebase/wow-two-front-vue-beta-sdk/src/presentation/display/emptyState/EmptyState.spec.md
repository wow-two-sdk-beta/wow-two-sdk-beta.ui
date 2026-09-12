# EmptyState

Renders a centred no-results affordance — icon, title, description, actions — from any subset of them.

Source: [EmptyState.vue](EmptyState.vue).

Public import: `import { EmptyState } from '@wow-two-beta/ui-vue/presentation/display';`.

## Contract

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `title` | `string \| number` | yes | — | The heading copy. a scalar stays a prop so it remains the discriminator, and the same-named slot is the rich override. |
| `description` | `string \| number` | no | `undefined` | The body copy below the title. Same prop-plus-slot pairing as `title`. |
| `size` | `EmptyStateSize` | no | `EmptyStateSize.Md` | The visual size. Default `md`. |

## Emits

None declared.

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `icon` | `icon(): unknown;` | The optional icon, centered in a tinted disc. |
| `title` | `title(): unknown;` | The heading copy — overrides the `title` prop's rendering. |
| `description` | `description(): unknown;` | The body copy — overrides the `description` prop's rendering. |
| `actions` | `actions(): unknown;` | The action(s) — usually one or two `Button`s. |

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [DisplayExamples.ts](../../../../apps/playground/src/gallery/fixtures/DisplayExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
