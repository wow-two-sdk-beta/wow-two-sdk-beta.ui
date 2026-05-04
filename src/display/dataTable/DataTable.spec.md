# DataTable

## Purpose
Data-bound table with built-in column-based sorting. Pass `columns` describing how to render each column and `data` (an array of rows). Renders a styled `Table` internally; sorts rows when a sortable header is clicked.

## Anatomy
```
<DataTable columns data />
```

(No compound subcomponents — DataTable renders the entire table from props.)

## Required behaviors
- Click a sortable column header → cycles `none → asc → desc → none` and re-sorts.
- Sort state controlled externally via `sortBy` + `onSortChange`, or uncontrolled with `defaultSortBy`.
- Each row keyed via `rowKey(row)`; `onRowClick(row)` fires on click.
- Headers carry `aria-sort` + a chevron indicator.

## Visual states
Inherits from `Table`. Sortable headers show hover/focus styling.

## Props
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `columns` | `DataTableColumn<T>[]` | — | yes | Column definitions. |
| `data` | `T[]` | — | yes | Row data. |
| `rowKey` | `(row, index) => string` | `index` | no | Stable React key per row. |
| `onRowClick` | `(row) => void` | — | no | Row activation. |
| `sortBy` | `{ columnKey, direction } \| null` | — | no | Controlled sort. |
| `defaultSortBy` | same | `null` | no | Uncontrolled. |
| `onSortChange` | `(sort) => void` | — | no | Sort callback. |
| `striped`, `hoverable`, `density`, `bare` | — | — | no | Forwarded to `Table`. |
| `emptyContent` | `ReactNode` | `'No results.'` | no | Fallback when `data` is empty. |

`DataTableColumn<T>`:
- `key`: string id
- `header`: ReactNode shown in the header
- `accessor?`: `(row) => unknown` — for sorting + default cell rendering
- `cell?`: `(row, index) => ReactNode` — custom cell render
- `sortable?`: boolean
- `align?`: `'left' \| 'center' \| 'right'`
- `width?`: CSS width string

## Composition
Renders a `Table` (same domain) with computed sort + cell mapping.

## Dependencies
Foundation: `utils/cn`. Same-domain: `display/table`.

## Known limitations
- Single-column sort only (defer multi-sort to P6).
- Client-side sort using `accessor` — for server-side sort, control via `sortBy` + handle externally without re-sorting in DataTable.
- No filtering, pagination, virtualization, row selection (defer to P6).

## Inspirations
- shadcn/ui `Data Table` recipe.
- Mantine `DataTable` (third-party).
- MUI `DataGrid`.
