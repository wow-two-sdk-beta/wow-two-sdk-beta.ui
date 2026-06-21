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
- Wraps in a horizontally-scrollable container by default (use `isBare` to skip).
- Scroll-wrapper corner radius via `radius`; extra wrapper classes via `containerClassName`. `className` still targets the inner `<table>`.
- Optional zebra striping on body rows via `isStriped`.
- Optional hover-row highlight via `isHoverable`.
- Compact / cozy / comfortable / roomy density via `density`.
- Header typography treatment via `Table.Head` `headVariant` (`uppercase` default, `plain` for normal-case `text-sm`).

## Visual states
Per row: `default` · `hover` · `selected` (manual via class)

## Props (Root)
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `isStriped` | `boolean` | `false` | no | Zebra body rows. |
| `isHoverable` | `boolean` | `false` | no | Highlight body rows on hover. |
| `density` | `'compact' \| 'cozy' \| 'comfortable' \| 'roomy'` | `'cozy'` | no | Cell padding scale. `roomy` = `px-5 py-4`. |
| `isBare` | `boolean` | `false` | no | Skip scroll container + outer border. |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | no | Scroll-wrapper corner radius (ignored when `isBare`). |
| `containerClassName` | `string` | — | no | Classes on the scroll wrapper (ignored when `isBare`). `className` lands on the inner `<table>`. |

## Props (`Table.Head`)
| Name | Type | Default | Required | Why |
|---|---|---|---|---|
| `headVariant` | `'uppercase' \| 'plain'` | `'uppercase'` | no | `uppercase` = `text-xs` uppercase tracking-wide (current look); `plain` = normal-case `text-sm`. |

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
