# Editable

## Purpose
Inline-edit text. Click the preview → swap to an input → commit on Enter / blur (or via explicit Submit), revert on Escape / Cancel.

## Anatomy
```
<Editable>
  ├── Editable.Preview     ← read mode
  └── Editable.Input       ← edit mode (auto-focused)
  └── Editable.Submit?     ← optional confirm button
  └── Editable.Cancel?     ← optional cancel button
</Editable>
```

Only one of Preview / Input is mounted at a time, controlled by `editing` state.

## Required behaviors
- Preview click (or Enter / Space when focused) → enters edit mode.
- Input blur (default) → commits. Configurable via `submitOnBlur=false`.
- Enter on input → commits.
- Escape on input → reverts.
- Submit / Cancel buttons available for explicit control.
- Disabled / read-only blocks the swap.

## Visual states
`reading` · `editing` · `disabled` · `read-only`

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `value` | `string` | — | Controlled committed value. |
| `defaultValue` | `string` | `''` | Uncontrolled initial. |
| `onValueChange` | `(value: string) => void` | — | Fires on commit only. |
| `editing` | `boolean` | — | Controlled edit-mode. |
| `defaultEditing` | `boolean` | `false` | Uncontrolled. |
| `onEditingChange` | `(editing: boolean) => void` | — | |
| `placeholder` | `string` | `'Click to edit'` | Shown when value is empty (preview mode). |
| `submitOnBlur` | `boolean` | `true` | |
| `submitOnEnter` | `boolean` | `true` | |
| `cancelOnEscape` | `boolean` | `true` | |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `name` | `string` | — | Hidden input emits committed value for forms. |

## Composition model
Compound (`Editable.Preview/Input/Submit/Cancel`). Root owns committed value + edit-mode state + draft (uncommitted edit-buffer); subcomponents read from context.

`Preview` and `Input` automatically swap based on `editing`. Consumers can omit one; e.g. `<Editable.Input>` alone for an always-on edit field. The Preview is rendered as a styled span by default; `asChild` allows custom triggers.

## Accessibility
- Preview is `tabIndex=0` button-like surface with `aria-label` derived from value or placeholder.
- Input gets focus on enter; cursor placed at end.
- Submit / Cancel are real `<button>` elements with `aria-label` defaults.

## Dependencies
Foundation: `utils/cn`, `forms/InputStyles`. No cross-domain.

## Inspirations
Chakra `Editable`, Mantine `InlineEdit`. We follow Chakra's compound shape.
