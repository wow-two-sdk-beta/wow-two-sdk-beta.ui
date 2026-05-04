# EmojiPicker

## Purpose
Searchable emoji grid with category navigation. Built-in subset (~200 most-used emoji) for first-gen, no full Unicode CLDR DB. Output: the picked emoji string.

## Anatomy
```
<EmojiPicker>
  ├── search input
  ├── category tab strip (sticky)
  └── grid of emoji buttons
</EmojiPicker>
```

## Required behaviors
- Filter by name match (search field).
- Category strip jumps to anchor.
- Click emoji → fire `onSelect`; consumer decides what to do.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `onSelect` | `(emoji: string) => void` | required | |
| `placeholder` | `string` | `'Search emoji…'` | |
| `columns` | `number` | `8` | |
| `cellSize` | `number` (px) | `28` | |
| `categories` | `EmojiCategory[]` | built-in | Override the dataset |
| `disabled` | `boolean` | `false` | |

## Composition
Single component. Designed to be used inside a `Popover` by consumers.

## Accessibility
- Search input.
- Category strip = `role="tablist"` (jump-to behavior).
- Grid: `role="grid"`; cells `role="gridcell"` containing `<button>` with `aria-label` (emoji name).

## Dependencies
Foundation: `utils`. Same domain: `forms/InputStyles`.
