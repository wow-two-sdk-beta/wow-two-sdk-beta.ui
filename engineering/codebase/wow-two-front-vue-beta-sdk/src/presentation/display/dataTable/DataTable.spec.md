# DataTable

Renders a sortable table from a `columns` descriptor, wrapping the `Table` primitives.

Source: [DataTable.vue](DataTable.vue).

Public import: `import { DataTable } from '@wow-two-beta/ui-vue/presentation/display';`.

## Contract

- Each controlled axis has one Vue model name and one update event. Primary values use `modelValue` / `update:modelValue`; disclosure uses `open` / `update:open`. Named axes use their declared `update:*` event. Defaults seed uncontrolled state once; external updates do not emit intent.
- The committed state uses the shared controlled-state helper: supplied controlled state is read from props; user changes report intent. The default seeds uncontrolled state. External prop updates do not themselves emit user changes.
- Undeclared attributes follow Vue fallthrough to the rendered root when the component has a single element root.

## Props

| Prop | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `columns` | `ReadonlyArray<DataTableColumn<T>>` | yes | — | Declared by the source contract. |
| `data` | `ReadonlyArray<T>` | yes | — | Declared by the source contract. |
| `rowKey` | `(row: T, index: number) => string \| number` | no | `undefined` | Declared by the source contract. |
| `onRowClick` | `(row: T, index: number) => void` | no | `undefined` | Fires with the clicked row and its index. Kept a prop rather than an emit because its *presence* is load-bearing — it seeds `isHoverable` and the `cursor-pointer` class, and Vue strips declared emit listeners out of `useAttrs()`. |
| `sortBy` | `DataTableSort \| null` | no | `undefined` | Declared by the source contract. |
| `defaultSortBy` | `DataTableSort \| null` | no | `undefined` | Declared by the source contract. |
| `isStriped` | `boolean` | no | `undefined` | Declared by the source contract. |
| `isHoverable` | `boolean` | no | `undefined` | Declared by the source contract. |
| `density` | `TableDensity` | no | `undefined` | Declared by the source contract. |
| `isBare` | `boolean` | no | `undefined` | Declared by the source contract. |
| `emptyContent` | `string \| number` | no | `'No results.'` | The empty-state text. Default `No results.`; override richly via the `emptyContent` slot. |

## Emits

| Event | Signature | Meaning |
|---|---|---|
| `update:sortBy` | `'update:sortBy': [sort: DataTableSort \| null];` | Fires when the reader clicks a sortable header, with the next sort or `null` once cleared. |

## Slots

| Slot | Signature | Meaning |
|---|---|---|
| `header` | `header(props: { column: DataTableColumn<T> }): unknown;` | Overrides a column header. Falls back to the column's own `header`. |
| `cell` | `cell(props: { row: T; column: DataTableColumn<T>; index: number }): unknown;` | Overrides a body cell. Falls back to the column's `cell`, then its `accessor`. |
| `emptyContent` | `emptyContent(): unknown;` | Overrides the empty-state content. Falls back to the `emptyContent` prop. |

## Exposed handle

No explicit exposed handle.

## Verification

- Public render fixture: [DisplayExamples.ts](../../../../apps/playground/src/gallery/fixtures/DisplayExamples.ts). This covers render/SSR compatibility, not all interaction behavior.
- Required follow-through for changes: verify the affected state, keyboard, focus, composition and cleanup paths; the existence of this specification is not a passing-test claim.
