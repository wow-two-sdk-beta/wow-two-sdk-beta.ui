# TagsInput

## Purpose
Free-form tag entry. User types text → Enter / comma / Tab commits a tag; Backspace at empty input deletes the last tag.

## Anatomy
```
<TagsInput>          ← outer container styled like an input
  <Tag/>             ← rendered per value entry (Tag from display/)
  <Tag/>
  <input/>           ← inline text input
</TagsInput>
```

## Required behaviors
- Enter / `,` / Tab → commit current text as new tag (if non-empty + not duplicate).
- Backspace on empty input → focus last tag → second Backspace removes it.
- Click anywhere on container → focuses inner input.
- Disabled / read-only propagate to chips (close buttons hidden).

## Visual states
`default` · `focus-within` · `invalid` · `disabled` · `read-only` · `empty (placeholder visible)`

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` | `string[]` | — | Controlled tags. |
| `defaultValue` | `string[]` | `[]` | Uncontrolled initial. |
| `onValueChange` | `(tags: string[]) => void` | — | Fires on add/remove. |
| `inputValue` | `string` | — | Controlled text in the input. |
| `onInputChange` | `(input: string) => void` | — | |
| `placeholder` | `string` | `'Add tag…'` | |
| `delimiters` | `string[]` | `[',']` | Extra characters that commit a tag (Enter always works). |
| `validate` | `(tag: string) => boolean` | `(t) => t.trim().length > 0` | Reject duplicates / empties / format. |
| `allowDuplicates` | `boolean` | `false` | |
| `max` | `number` | — | Cap on number of tags. |
| `disabled` / `invalid` / `readOnly` | `boolean` | `false` | |
| `name` | `string` | — | Hidden input emits comma-joined value. |
| `tagVariant` | `TagVariants['variant']` | `'neutral'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Mirrors `inputBaseVariants`. |

## Composition model
Single `<TagsInput>` component. No compound surface — tag rendering is internal. Cross-domain import: `display/Tag` for the chips.

## Accessibility
- `role="group"`, `aria-label` recommended.
- Inner input gets all standard form attrs (id, disabled, readOnly, aria-invalid).
- Each chip's close button has `aria-label`.
- Backspace-back-to-tag transition uses `tabindex` so keyboard users can navigate to a chip.

## Dependencies
Foundation: `utils`, `forms/InputStyles`. Cross-domain: `display/Tag`.

## Inspirations
Mantine `TagsInput`, Ark `TagsInput`, react-tag-input.
