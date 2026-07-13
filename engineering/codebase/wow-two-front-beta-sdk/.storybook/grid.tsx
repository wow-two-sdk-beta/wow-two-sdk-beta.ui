import type { ReactNode } from 'react';

/**
 * Generic 2D matrix renderer for Storybook stories.
 *
 * Use to visualize a component across two axes simultaneously — variants × tones,
 * sizes × shapes, etc. Each cell renders the component with the row+col combo.
 *
 * Pair with `storybook-addon-pseudo-states` to multiply by interaction states
 * (hover / focus-visible / active) without manual hover.
 *
 * @example
 * <Grid
 *   rows={['solid', 'soft', 'outline', 'ghost', 'link', 'glass']}
 *   cols={['primary', 'neutral', 'danger', 'success', 'warning']}
 *   rowLabel="variant"
 *   colLabel="tone"
 *   render={(variant, tone) => (
 *     <Button variant={variant} tone={tone}>Action</Button>
 *   )}
 * />
 */

export interface GridProps<R extends string, C extends string> {
  rows: readonly R[];
  cols: readonly C[];
  /** Human-readable axis label rendered above the row headers. */
  rowLabel?: string;
  /** Human-readable axis label rendered to the left of the col headers. */
  colLabel?: string;
  /** Per-cell renderer. Receives the row + col values for the current cell. */
  render: (row: R, col: C) => ReactNode;
  /** Optional cell wrapper styling (e.g. `bg-card p-4` for image-overlay testing). */
  cellClassName?: string;
  /** Optional grid-level wrapper class (e.g. `dir="rtl"` is set via parent if needed). */
  className?: string;
}

export function Grid<R extends string, C extends string>({
  rows,
  cols,
  rowLabel,
  colLabel,
  render,
  cellClassName = '',
  className = '',
}: GridProps<R, C>) {
  return (
    <div className={`inline-block ${className}`}>
      <table className="border-separate border-spacing-3">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground pr-2">
              {rowLabel && colLabel ? `${rowLabel} ↓ / ${colLabel} →` : rowLabel ?? colLabel ?? ''}
            </th>
            {cols.map((col) => (
              <th key={col} className="text-left text-xs font-medium text-muted-foreground capitalize">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th className="text-left text-xs font-medium text-muted-foreground capitalize pr-2 align-middle">
                {row}
              </th>
              {cols.map((col) => (
                <td key={`${row}-${col}`} className={`align-middle ${cellClassName}`}>
                  {render(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Single-axis matrix — when only rows or only cols vary, use this for cleaner output.
 *
 * @example
 * <Row label="size" items={['xs', 'sm', 'md', 'lg', 'xl']} render={(size) => <Button size={size}>Save</Button>} />
 */
export interface RowProps<T extends string> {
  items: readonly T[];
  label?: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export function Row<T extends string>({ items, label, render, className = '' }: RowProps<T>) {
  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="text-xs font-medium text-muted-foreground capitalize">{label}</div>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        {items.map((item) => (
          <div key={item} className="inline-flex flex-col items-center gap-1">
            {render(item)}
            <span className="text-[10px] text-subtle-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
