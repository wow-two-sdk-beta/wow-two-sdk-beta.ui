# IconPicker

## Purpose
Searchable grid for picking an icon by name. First-gen accepts a consumer-supplied `icons` map (`name → ReactNode`); ships a small built-in set as a fallback. Output: the selected name.

## Anatomy
```
<IconPicker>
  ├── search input
  └── grid of icon buttons
</IconPicker>
```

## Required behaviors
- Filter icons by case-insensitive name match.
- Click an icon → set `value` and (optionally) close.
- Keyboard: arrow keys grid-navigate; Enter selects.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `string` | controlled / uncontrolled | Selected icon name |
| `icons` | `Record<string, ReactNode>` | built-in subset | Available icons |
| `columns` | `number` | `8` | Grid columns |
| `size` | `number` (px) | `20` | Icon size |
| `iconButtonSize` | `number` (px) | `36` | Cell size |
| `placeholder` | `string` | `'Search icons…'` | |
| `name` | `string` | — | Hidden input |
| `disabled` | `boolean` | `false` | |

## Accessibility
- Search input is `<input type="search">`.
- Grid is `role="grid"`; cells `role="gridcell"` containing `<button>`.
- Selected button has `aria-pressed="true"`.

## Dependencies
Foundation: `utils`, `icons`. Same domain: `forms/InputStyles`.
