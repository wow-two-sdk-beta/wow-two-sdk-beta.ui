# DateTimeInput

Renders a typed `YYYY-MM-DD HH:MM` field with a `CalendarPicker` plus hour/minute popover on its button.

Source: [DateTimeInput.vue](DateTimeInput.vue).

Public import: `import { DateTimeInput } from '@wow-two-beta/ui-vue/presentation/forms';`.

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
| `modelValue` | `Temporal.PlainDateTime \| null` | no | — | The value, controlled. The `v-model` binding target. `null` is the cleared state. |
| `defaultValue` | `Temporal.PlainDateTime \| null` | no | — | The initial value when uncontrolled. |
| `min` | `Temporal.PlainDateTime \| null` | no | — | The earliest selectable wall-clock instant. |
| `max` | `Temporal.PlainDateTime \| null` | no | — | The latest selectable wall-clock instant. |
| `native` | `boolean` | no | `false` | Renders a bare `<input type="datetime-local">` and drops the popover. Opt-in only. The browser owns that control's picker panel — it cannot be themed, so it lands a system-chrome popup in the middle of a design-system form. Reach for it when the platform picker is the point (a mobile-first form wanting the OS wheels, for instance). |
| `minuteStep` | `number` | no | `5` | The minute interval offered in the popover. Default 5. Ignored when `native`. |
| `placeholder` | `string` | no | `'YYYY-MM-DD HH:MM'` | The empty-state text. Ignored when `native` — that control renders its own mask. |
| `name` | `string` | no | — | The hidden input name; when set, a hidden input ships the ISO value with form submission. |
| `id` | `string` | no | — | The control's id. Auto-filled from `FormControl` context when omitted. |
| `disabled` | `boolean` | no | `undefined` | The disabled state. Falls back to the surrounding form control's `isDisabled`. |
| `required` | `boolean` | no | `undefined` | The required state. Falls back to the surrounding form control's `isRequired`. |

## Emits

| Event | Signature | Meaning |
|---|---|---|
| `update:modelValue` | `'update:modelValue': [value: Temporal.PlainDateTime \| null];` | Fires when the reader types or picks a date and time — the `v-model` half. |

## Slots

None declared.

## Exposed handle

`{ el: root }`. Read this through a component template ref after mount; the referenced DOM node may be absent while unmounted.

## Verification

- Public render fixture: [FormsExamples.ts](../../../../apps/playground/src/gallery/fixtures/FormsExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Focused test references: [DateTimeControls.dom.test.ts](../../../../tests/unit/presentation/forms/DateTimeControls.dom.test.ts). Consult the named test assertions for the behavior actually covered.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
