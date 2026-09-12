# KeyboardShortcutPicker

Renders a record button that captures the next key chord the reader presses.

Source: [KeyboardShortcutPicker.vue](KeyboardShortcutPicker.vue).

Public import: `import { KeyboardShortcutPicker } from '@wow-two-beta/ui-vue/presentation/forms';`.

## Contract

- Each controlled axis has one Vue model name and one update event. Primary values use `modelValue` / `update:modelValue`; disclosure uses `open` / `update:open`. Named axes use their declared `update:*` event. Defaults seed uncontrolled state once; external updates do not emit intent.
- Native form reset requests the original seed through the outer state owner. Nested controls reconcile without issuing their own default requests. Composite drafts remount from the resolved state. A cancelled reset changes nothing.

- The committed state uses the shared controlled-state helper: supplied controlled state is read from props; user changes report intent. The default seeds uncontrolled state. External prop updates do not themselves emit user changes.
- Automatic attribute inheritance is disabled; the source explicitly forwards and merges supported fallthrough attributes.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `modelValue` | `ReadonlyArray<string>` | no | `undefined` | The captured chord, controlled. The `v-model` binding target. |
| `defaultValue` | `ReadonlyArray<string>` | no | — | The initial chord when uncontrolled. |
| `placeholder` | `string \| number` | no | `'Click to record'` | The idle label. Fill the `placeholder` slot for richer content. |
| `recordLabel` | `string \| number` | no | `'Press keys…'` | The listening label. Fill the `recordLabel` slot for richer content. |
| `name` | `string` | no | — | The hidden input name; the hidden input emits the `+`-joined chord. |
| `id` | `string` | no | — | The control's id. Auto-filled from `FormControl` context when omitted. |
| `disabled` | `boolean` | no | `undefined` | The disabled state. Falls back to the surrounding form control's `isDisabled`. |

## Emits

| Event | Signature | Meaning |
|---|---|---|
| `update:modelValue` | `'update:modelValue': [keys: ReadonlyArray<string>];` | Fires when the reader records or clears a chord — the `v-model` half. |

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `placeholder` | `placeholder?(): unknown;` | See the declared signature. |
| `recordLabel` | `recordLabel?(): unknown;` | See the declared signature. |

## Exposed handle

`{ el: button }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [FormsExamples.ts](../../../../apps/playground/src/gallery/fixtures/FormsExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
