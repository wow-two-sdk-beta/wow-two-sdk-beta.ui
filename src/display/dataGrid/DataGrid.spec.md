# DataGrid

## Purpose
Editable spreadsheet-grade table. Click a cell → edit; arrow-keys navigate; Enter commits; Escape reverts. Single-cell selection model (range select / fill handle / paste deferred to a follow-up).

## Anatomy
```
<DataGrid columns rows onRowChange editableColumns?>
  ├── header (col labels)
  └── body (rows × cells)
       └── active cell: <input> in edit mode, <span> in read mode
</DataGrid>
```

## Required behaviors
- Click cell → enter edit mode (if column is editable).
- Arrow keys move active cell (read mode).
- Enter or F2 → enter edit mode.
- Escape in edit mode → revert.
- Tab in edit mode → commit + move right.
- Enter in edit mode → commit + move down.
- Per-column type: `'text' | 'number' | 'select' | 'boolean'`. Determines edit input.
- Per-column `editable` flag (default `true`).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `columns` | `DataGridColumn<T>[]` | required | Schema |
| `rows` | `T[]` | required | |
| `rowKey` | `(row: T) => string` | required | |
| `onRowChange` | `(row: T, colKey: string, value: unknown) => void` | required | Per-cell commit |
| `dense` | `boolean` | `false` | Smaller row height |

## Composition
Single component. Internal state: `activeCell`, `editing`, `draftValue`. No compound surface.

## Accessibility
- Wrapper `role="grid"`; rows `role="row"`; cells `role="gridcell"` with `aria-readonly`/`aria-selected`/`aria-rowindex`/`aria-colindex`.
- Active cell has `tabIndex=0`, others `tabIndex=-1` (roving focus).

## Dependencies
Foundation: `utils`, `forms/InputStyles`. Same-domain: `display/Table` styles inspired but inline (different pattern).

## Known limitations (deferred to follow-up)
- Range selection (drag).
- Fill handle (corner drag).
- Copy/paste TSV.
- Frozen rows/cols.
- Column resize/reorder/pin.
- Cell merge.
- Sticky header.
- Server-side data.
