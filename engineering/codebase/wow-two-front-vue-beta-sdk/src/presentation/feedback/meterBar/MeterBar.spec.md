# MeterBar

Renders a horizontal gauge whose fill color crosses threshold zones — green / amber / red.

Source: [MeterBar.vue](MeterBar.vue).

Public import: `import { MeterBar } from '@wow-two-beta/ui-vue/presentation/feedback';`.

## Contract

- Compose using the props, slots and events below. Preserve the rendered element’s native semantics and provide the required content/data.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `value` | `number` | yes | — | The current value 0–`max`. |
| `max` | `number` | no | `100` | Declared by the source contract. |
| `thresholds` | `[number, number]` | no | — | The threshold values that change the fill tone. Pass `[good, warn]` — `value <= good` → success, `<= warn` → warning, otherwise destructive. Defaults: `[max * 0.7, max * 0.9]`. |
| `size` | `Size` | no | `SizeToken.Md` | The bar thickness. |
| `label` | `string` | no | — | Declared by the source contract. |

## Emits

None declared.

## Slots

None declared.

## Exposed handle

`{ el }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [FeedbackExamples.ts](../../../../apps/playground/src/gallery/fixtures/FeedbackExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
