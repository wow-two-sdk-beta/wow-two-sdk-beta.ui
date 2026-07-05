# FontPicker

## Purpose
Searchable font-family picker with live preview. Each option is rendered in its own font face. First-gen accepts a consumer-supplied `fonts` list; ships a small built-in set of system + web-safe font stacks as a default.

## Anatomy
```
<FontPicker>
  ├── trigger button (current font, rendered in its face)
  └── popover
       ├── search input
       └── list of options (each rendered in its own face)
</FontPicker>
```

## Required behaviors
- Click trigger → opens popover with options.
- Filter by name match (case-insensitive).
- Click option → set `value`, close.
- Each option's row uses the option's `family` for `font-family`.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `string` | controlled / uncontrolled | Selected family stack |
| `fonts` | `Array<{ name; family; sample? }>` | built-in | List of options |
| `placeholder` | `string` | `'Select font…'` | |
| `previewText` | `string` | `'The quick brown fox'` | Per-option sample |
| `disabled` | `boolean` | `false` | |
| `name` | `string` | — | Hidden input |

## Composition
Wraps `overlays/Popover` (cross-domain). Trigger is a styled button that displays the current value in its own font.

## Accessibility
- Trigger: `aria-haspopup="listbox"` + `aria-expanded`.
- Listbox role on popover content.
- Each option `role="option"` with `aria-selected`.

## Dependencies
Foundation: `utils`. Cross-domain: `overlays/Popover`.
