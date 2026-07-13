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
import { cn } from '../../../foundation/utils';

/** Defines the Table row density. */
export const TableDensity = {
  /** Refers to the tightest padding. */
  Compact: 'compact',
  /** Refers to the default padding. */
  Cozy: 'cozy',
  /** Refers to relaxed padding. */
  Comfortable: 'comfortable',
  /** Refers to the roomiest padding. */
  Roomy: 'roomy',
} as const;

export type TableDensity = (typeof TableDensity)[keyof typeof TableDensity];

/** Defines the corner radius applied to the Table scroll wrapper. */
export const TableRadius = {
  /** Refers to square corners. */
  None: 'none',
  /** Refers to a small radius. */
  Sm: 'sm',
  /** Refers to a medium radius. */
  Md: 'md',
  /** Refers to a large radius. */
  Lg: 'lg',
  /** Refers to an extra-large radius. */
  Xl: 'xl',
  /** Refers to a 2x-large radius. */
  Xxl: '2xl',
} as const;

export type TableRadius = (typeof TableRadius)[keyof typeof TableRadius];

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
  /** The corner radius of the scroll wrapper (ignored when `isBare`). */
  radius?: TableRadius;

  /** The classes applied to the scroll wrapper (ignored when `isBare`). `className` still lands on the inner `<table>`. */
  containerClassName?: string;
  children: ReactNode;
}

const TableRoot = forwardRef<HTMLTableElement, TableProps>(function Table(
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

/** Defines the Table header typography treatment. */
export const TableHeadVariant = {
  /** Refers to the uppercase, tracked default. */
  Uppercase: 'uppercase',
  /** Refers to normal-case `text-sm` heads. */
  Plain: 'plain',
} as const;

export type TableHeadVariant = (typeof TableHeadVariant)[keyof typeof TableHeadVariant];

const HEAD_VARIANT: Record<TableHeadVariant, string> = {
  uppercase: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  plain: 'text-sm font-semibold text-foreground',
};

export interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  /** The typography treatment for the header row. Defaults to `uppercase` (current look). */
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

export const Table = Object.assign(TableRoot, {
  Head: TableHead,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  Caption: TableCaption,
});

export default Table;
