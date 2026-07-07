import { useMemo, type ReactNode } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableDensity,
} from '../table';

/** Defines the sort order of a DataTable column. */
export const SortDirection = {
  /** Refers to ascending order. */
  Asc: 'asc',
  /** Refers to descending order. */
  Desc: 'desc',
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

/** Defines the horizontal text alignment of a DataTable column. */
export const DataTableColumnAlign = {
  /** Refers to left alignment. */
  Left: 'left',
  /** Refers to centered alignment. */
  Center: 'center',
  /** Refers to right alignment. */
  Right: 'right',
} as const;

export type DataTableColumnAlign =
  (typeof DataTableColumnAlign)[keyof typeof DataTableColumnAlign];

export interface DataTableSort {
  columnKey: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T) => unknown;
  cell?: (row: T, index: number) => ReactNode;
  isSortable?: boolean;
  align?: DataTableColumnAlign;
  width?: string;
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<DataTableColumn<T>>;
  data: ReadonlyArray<T>;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  sortBy?: DataTableSort | null;
  defaultSortBy?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  isStriped?: boolean;
  isHoverable?: boolean;
  density?: TableDensity;
  isBare?: boolean;
  emptyContent?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Temporal.PlainDate && b instanceof Temporal.PlainDate)
    return Temporal.PlainDate.compare(a, b);
  if (a instanceof Temporal.PlainTime && b instanceof Temporal.PlainTime)
    return Temporal.PlainTime.compare(a, b);
  if (a instanceof Temporal.PlainDateTime && b instanceof Temporal.PlainDateTime)
    return Temporal.PlainDateTime.compare(a, b);
  if (a instanceof Temporal.ZonedDateTime && b instanceof Temporal.ZonedDateTime)
    return Temporal.ZonedDateTime.compare(a, b);
  // Native `Date` retained: DataTable cells hold arbitrary consumer values, so a
  // consumer may still put a `Date` in a column — this is a generic value
  // comparator, not a date-value API surface.
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b));
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  sortBy,
  defaultSortBy,
  onSortChange,
  isStriped,
  isHoverable = !!onRowClick,
  density,
  isBare,
  emptyContent = 'No results.',
  className,
  'aria-label': ariaLabel,
}: DataTableProps<T>) {
  const [sort, setSort] = useControlled<DataTableSort | null>({
    controlled: sortBy,
    default: defaultSortBy ?? null,
    onChange: onSortChange,
  });

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.columnKey);
    if (!col?.accessor) return data;
    const accessor = col.accessor;
    const sorted = [...data].sort((a, b) => {
      const r = defaultCompare(accessor(a), accessor(b));
      return sort.direction === 'asc' ? r : -r;
    });
    return sorted;
  }, [data, columns, sort]);

  const cycleSort = (columnKey: string) => {
    if (!sort || sort.columnKey !== columnKey) {
      setSort({ columnKey, direction: 'asc' });
    } else if (sort.direction === 'asc') {
      setSort({ columnKey, direction: 'desc' });
    } else {
      setSort(null);
    }
  };

  const alignClass = (a: DataTableColumn<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <Table
      isStriped={isStriped}
      isHoverable={isHoverable}
      density={density}
      isBare={isBare}
      className={className}
      aria-label={ariaLabel}
    >
      <TableHead>
        <TableRow>
          {columns.map((col) => {
            const isSorted = sort?.columnKey === col.key;
            const ariaSort = isSorted
              ? sort?.direction === 'asc'
                ? 'ascending'
                : 'descending'
              : col.isSortable
                ? 'none'
                : undefined;
            return (
              <TableHeaderCell
                key={col.key}
                aria-sort={ariaSort}
                style={col.width ? { width: col.width } : undefined}
                className={alignClass(col.align)}
              >
                {col.isSortable ? (
                  <button
                    type="button"
                    onClick={() => cycleSort(col.key)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    <span>{col.header}</span>
                    {isSorted ? (
                      sort?.direction === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </TableHeaderCell>
            );
          })}
        </TableRow>
      </TableHead>
      <TableBody>
        {sortedData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
              {emptyContent}
            </TableCell>
          </TableRow>
        ) : (
          sortedData.map((row, rowIndex) => {
            const key = rowKey ? rowKey(row, rowIndex) : rowIndex;
            return (
              <TableRow
                key={key}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={alignClass(col.align)}>
                    {col.cell
                      ? col.cell(row, rowIndex)
                      : col.accessor
                        ? (col.accessor(row) as ReactNode)
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
