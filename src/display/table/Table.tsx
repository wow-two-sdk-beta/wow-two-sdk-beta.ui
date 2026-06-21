import {
  createContext,
  forwardRef,
  useContext,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
} from 'react';
import { cn } from '../../utils';

export type TableDensity = 'compact' | 'cozy' | 'comfortable' | 'roomy';

/** Radius applied to the scroll wrapper. Mirrors the shared surface radius scale. */
export type TableRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface TableContextValue {
  isStriped: boolean;
  isHoverable: boolean;
  density: TableDensity;
}

const TableContext = createContext<TableContextValue>({
  isStriped: false,
  isHoverable: false,
  density: 'cozy',
});

const DENSITY_CELL: Record<TableDensity, string> = {
  compact: 'px-2 py-1.5 text-sm',
  cozy: 'px-3 py-2 text-sm',
  comfortable: 'px-4 py-3 text-sm',
  roomy: 'px-5 py-4 text-sm',
};

const WRAPPER_RADIUS: Record<TableRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  isStriped?: boolean;
  isHoverable?: boolean;
  density?: TableDensity;
  isBare?: boolean;
  /** Corner radius of the scroll wrapper (ignored when `isBare`). */
  radius?: TableRadius;
  /** Classes applied to the scroll wrapper (ignored when `isBare`). `className` still lands on the inner `<table>`. */
  containerClassName?: string;
  children: ReactNode;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    isStriped = false,
    isHoverable = false,
    density = 'cozy',
    isBare = false,
    radius = 'md',
    containerClassName,
    className,
    children,
    ...rest
  },
  ref,
) {
  const ctx = { isStriped, isHoverable, density };
  const tableEl = (
    <table
      ref={ref}
      className={cn('w-full caption-bottom border-collapse text-left', className)}
      {...rest}
    >
      {children}
    </table>
  );
  return (
    <TableContext.Provider value={ctx}>
      {isBare ? tableEl : (
        <div
          className={cn(
            'relative w-full overflow-x-auto border border-border',
            WRAPPER_RADIUS[radius],
            containerClassName,
          )}
        >
          {tableEl}
        </div>
      )}
    </TableContext.Provider>
  );
});

/** Header typography treatment. `uppercase` is the default look; `plain` keeps normal-case `text-sm` heads. */
export type TableHeadVariant = 'uppercase' | 'plain';

const HEAD_VARIANT: Record<TableHeadVariant, string> = {
  uppercase: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  plain: 'text-sm font-semibold text-foreground',
};

export interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  /** Typography treatment for the header row. Defaults to `uppercase` (current look). */
  headVariant?: TableHeadVariant;
}

export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(
  function TableHead({ className, headVariant = 'uppercase', ...rest }, ref) {
    return (
      <thead
        ref={ref}
        className={cn('border-b border-border bg-muted/50', HEAD_VARIANT[headVariant], className)}
        {...rest}
      />
    );
  },
);

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className, ...rest }, ref) {
    const ctx = useContext(TableContext);
    return (
      <tbody
        ref={ref}
        className={cn(
          ctx.isStriped && '[&>tr:nth-child(even)]:bg-muted/30',
          ctx.isHoverable && '[&>tr:hover]:bg-muted',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableFooter({ className, ...rest }, ref) {
    return (
      <tfoot
        ref={ref}
        className={cn('border-t border-border bg-muted/50 font-medium', className)}
        {...rest}
      />
    );
  },
);

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  function TableRow({ className, ...rest }, ref) {
    return (
      <tr
        ref={ref}
        className={cn('border-b border-border last:border-0 transition-colors data-[selected]:bg-primary-soft', className)}
        {...rest}
      />
    );
  },
);

export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export const TableHeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  function TableHeaderCell({ className, ...rest }, ref) {
    const ctx = useContext(TableContext);
    return (
      <th
        ref={ref}
        scope="col"
        className={cn(DENSITY_CELL[ctx.density], 'font-semibold text-foreground', className)}
        {...rest}
      />
    );
  },
);

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, ...rest },
  ref,
) {
  const ctx = useContext(TableContext);
  return (
    <td
      ref={ref}
      className={cn(DENSITY_CELL[ctx.density], 'align-middle', className)}
      {...rest}
    />
  );
});

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(function TableCaption({ className, ...rest }, ref) {
  return (
    <caption
      ref={ref}
      className={cn('mt-2 text-sm text-muted-foreground', className)}
      {...rest}
    />
  );
});

type TableComponent = typeof Table & {
  Head: typeof TableHead;
  Body: typeof TableBody;
  Footer: typeof TableFooter;
  Row: typeof TableRow;
  HeaderCell: typeof TableHeaderCell;
  Cell: typeof TableCell;
  Caption: typeof TableCaption;
};

(Table as TableComponent).Head = TableHead;
(Table as TableComponent).Body = TableBody;
(Table as TableComponent).Footer = TableFooter;
(Table as TableComponent).Row = TableRow;
(Table as TableComponent).HeaderCell = TableHeaderCell;
(Table as TableComponent).Cell = TableCell;
(Table as TableComponent).Caption = TableCaption;

export default Table as TableComponent;
