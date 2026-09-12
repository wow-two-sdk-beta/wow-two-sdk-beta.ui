# StatCard

Renders a KPI tile — label, big value, optional trend and helper — for dashboard grids.

Source: [StatCard.vue](StatCard.vue).

Public import: `import { StatCard } from '@wow-two-beta/ui-vue/presentation/display';`.

## Contract

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `label` | `string \| number` | yes | — | The label above the value. Rich content goes through the `label` slot. |
| `value` | `string \| number` | yes | — | The primary value (large). Rich content goes through the `value` slot. |
| `trend` | `StatCardTrend` | no | — | The optional trend — positive = up/green, negative = down/red. |
| `helper` | `string \| number` | no | — | The optional helper / supporting text below. Rich content goes through the `helper` slot. |
| `size` | `StatCardSize` | no | `'md'` | The visual size. Default `md`. |

## Emits

None declared.

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `label` | `label?(): unknown;` | The rich override for the `label` prop. |
| `value` | `value?(): unknown;` | The rich override for the `value` prop. |
| `helper` | `helper?(): unknown;` | The rich override for the `helper` prop. |

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [DisplayExamples.ts](../../../../apps/playground/src/gallery/fixtures/DisplayExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
