/**
 * Shared vocabulary for the DataGrid folder.
 *
 * React kept these next to the component in `DataGrid.tsx`, where the private
 * `CellEditor` could close over them. Here `CellEditor` is its own SFC, so the
 * enums live in a sibling module both files import — the same split `table/`
 * uses for `TableContext.ts`. `DataGridMove` stays out of the folder barrel,
 * exactly as it was module-private in React.
 */

/** Defines the editable data type of a DataGrid cell. */
export const DataGridCellType = {
  /** Refers to a free-text cell. */
  Text: 'text',
  /** Refers to a numeric cell. */
  Number: 'number',
  /** Refers to a single-select cell. */
  Select: 'select',
  /** Refers to a boolean (checkbox) cell. */
  Boolean: 'boolean',
} as const;

export type DataGridCellType = (typeof DataGridCellType)[keyof typeof DataGridCellType];

/** Defines the horizontal text alignment of a DataGrid column. */
export const DataGridColumnAlign = {
  /** Refers to left alignment. */
  Left: 'left',
  /** Refers to right alignment. */
  Right: 'right',
  /** Refers to centered alignment. */
  Center: 'center',
} as const;

export type DataGridColumnAlign =
  (typeof DataGridColumnAlign)[keyof typeof DataGridColumnAlign];

/** Defines the cursor advance after a DataGrid cell edit commits. */
export const DataGridMove = {
  /** Refers to advancing to the cell on the right. */
  Right: 'right',
  /** Refers to advancing to the cell below. */
  Down: 'down',
} as const;

export type DataGridMove = (typeof DataGridMove)[keyof typeof DataGridMove];

export interface DataGridColumn<T> {
  key: string;
  /**
   * The header label. React took a `ReactNode`; a column is an array entry and
   * cannot become its own slot, so the scalar stays here and the `header`
   * scoped slot is the rich override.
   */
  header: string | number;
  /** Returns the cell's underlying value. */
  accessor: (row: T) => unknown;

  /**
   * Optional custom cell renderer for read mode. Returns a value rendered as
   * text; for rich markup use the `cell` scoped slot, which receives
   * `{ row, column, rowIndex, colIndex }`.
   */
  cell?: (row: T) => unknown;
  type?: DataGridCellType;
  /** The choices for a `select` cell. `label` is rendered as `<option>` text. */
  options?: Array<{ value: string | number; label: string | number }>;
  isEditable?: boolean;
  width?: string;
  align?: DataGridColumnAlign;
}
