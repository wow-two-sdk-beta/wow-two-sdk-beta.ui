# Table

## Purpose
Styled wrapper around the native HTML table elements. Use when you control the row markup directly. For data-bound tables with sorting/pagination, use `DataTable`.

## Anatomy
```
<Table>
  ├── <Table.Caption>
  ├── <Table.Head>
  │     └── <Table.Row>
  │           └── <Table.HeaderCell>
  ├── <Table.Body>
  │     └── <Table.Row>
  │           └── <Table.Cell>
  └── <Table.Footer>
        └── <Table.Row>
              └── <Table.Cell>
</Table>
```

## Required behaviors
- Wraps in a horizontally-scrollable container by default (use `bare` to skip).
- Optional zebra striping on body rows via `striped`.
- Optional hover-row highlight via `hoverable`.
- Compact / cozy / comfortable density via `density`.

## Visual states
Per row: `default` · `hover` · `selected` (manual via class)

## Props (Root)
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `striped` | `boolean` | `false` | no | Zebra body rows. |
| `hoverable` | `boolean` | `false` | no | Highlight body rows on hover. |
| `density` | `'compact' \| 'cozy' \| 'comfortable'` | `'cozy'` | no | Cell padding scale. |
| `bare` | `boolean` | `false` | no | Skip scroll container + outer border. |

## Composition
Compound. Subcomponents are thin wrappers around `<thead>` / `<tbody>` / `<tfoot>` / `<tr>` / `<th>` / `<td>`.

## Dependencies
Foundation: `utils/cn`. Same-domain: none.

## Known limitations
- No row-level selection helpers — caller adds checkboxes if needed.
- No virtualization.

## Inspirations
- shadcn/ui `Table`.
- Mantine `Table`.
