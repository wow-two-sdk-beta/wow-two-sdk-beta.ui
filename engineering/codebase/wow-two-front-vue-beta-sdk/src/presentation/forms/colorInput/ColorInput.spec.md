# ColorInput

Renders a hex text field with a live swatch, committing on blur or Enter and reverting an unparseable draft.

Source: [ColorInput.vue](ColorInput.vue).

Public import: `import { ColorInput } from '@wow-two-beta/ui-vue/presentation/forms';`.

## Contract

- Each controlled axis has one Vue model name and one update event. Primary values use `modelValue` / `update:modelValue`; disclosure uses `open` / `update:open`. Named axes use their declared `update:*` event. Defaults seed uncontrolled state once; external updates do not emit intent.
- Native form reset requests the original seed through the state owner and restores the resulting DOM representation; a cancelled reset changes nothing.
- The committed state uses the shared controlled-state helper: supplied controlled state is read from props; user changes report intent. The default seeds uncontrolled state. External prop updates do not themselves emit user changes.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `size` | `InputSize` | no | — | The control size. |
| `state` | `InputState` | no | — | The validity surface. |
| `border` | `InputBorder` | no | — | The border weight. |
| `ring` | `InputRing` | no | — | The focus-ring weight. |
| `modelValue` | `string \| null` | no | — | The committed hex, controlled. The `v-model` binding target. |
| `defaultValue` | `string \| null` | no | — | The initial hex when uncontrolled. |
| `swatchShape` | `SwatchShape` | no | `SwatchShapeValue.Square` | The swatch outline shape shown inside the field. |
| `hasAlpha` | `boolean` | no | `false` | Whether a committed hex keeps its alpha channel (`#RRGGBBAA`). |
| `id` | `string` | no | — | The control's id. Auto-filled from `FormControl` context when omitted. |
| `disabled` | `boolean` | no | `undefined` | The disabled state. Falls back to the surrounding form control's `isDisabled`. |
| `required` | `boolean` | no | `undefined` | The required state. Falls back to the surrounding form control's `isRequired`. |

## Emits

| Event | Signature | Meaning |
|---|---|---|
| `update:modelValue` | `'update:modelValue': [value: string \| null];` | Fires when the reader commits a new hex on blur or Enter — the `v-model` half. |

## Slots

None declared.

## Exposed handle

`{ el: root }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [FormsExamples.ts](../../../../apps/playground/src/gallery/fixtures/FormsExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
