// Shared month-grid renderer for Calendar and RangeCalendar. Co-located in
// `forms/` as a domain-internal helper. Owns:
//   - the 42-cell visual layout (header + weekday row + 6×7 grid)
//   - keyboard navigation (arrows / Home/End / PgUp/PgDn / Shift+PgUp/PgDn)
//   - focused-cell management (autofocus on focusedDate change)
//   - month nav buttons
//
// Consumers (Calendar, RangeCalendar) provide:
//   - their own selection state via `dayProps(date)` returning extra attrs
//   - `onDayActivate(date)` callback for click/Enter/Space
//
// Not exported from `forms/index.ts` — internal only.

import {
  useCallback,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils';
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  buildMonthGrid,
  isSameDay,
  isToday,
  startOfMonth,
} from './DateExtensions';

export interface MonthGridDayProps
  extends Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'className' | 'onPointerEnter' | 'onPointerLeave' | 'aria-selected'
  > {
  /** Extra `data-*` attributes (data-selected, data-range-start, etc.). */
  [key: `data-${string}`]: string | boolean | undefined;
}

export interface MonthGridProps {
  /** First day of the visible month (use `startOfMonth(date)`). */
  viewMonth: Date;
  /** Called when prev/next steps the visible month. */
  onViewMonthChange: (date: Date) => void;
  /** The currently focused day (cell tabIndex=0). */
  focusedDate: Date;
  /** Called by keyboard navigation. */
  onFocusedDateChange: (date: Date) => void;
  /** Predicate marking a day as disabled. */
  isDayDisabled?: (date: Date) => boolean;
  /** Click / Enter / Space activation. */
  onDayActivate?: (date: Date, meta: { outOfMonth: boolean }) => void;
  /** Extra per-day attributes for selection styling and hover handlers. */
  dayProps?: (date: Date, meta: { outOfMonth: boolean }) => MonthGridDayProps | undefined;
  'aria-label'?: string;
  className?: string;
}

export function MonthGrid({
  viewMonth,
  onViewMonthChange,
  focusedDate,
  onFocusedDateChange,
  isDayDisabled,
  onDayActivate,
  dayProps,
  'aria-label': ariaLabel = 'Calendar',
  className,
}: MonthGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Re-focus the active day cell when focusedDate changes (keyboard nav).
  useEffect(() => {
    const cell = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${focusedDate.toDateString()}"]`,
    );
    cell?.focus();
  }, [focusedDate]);

  const moveFocus = useCallback(
    (next: Date) => {
      if (
        next.getMonth() !== viewMonth.getMonth() ||
        next.getFullYear() !== viewMonth.getFullYear()
      ) {
        onViewMonthChange(startOfMonth(next));
      }
      onFocusedDateChange(next);
    },
    [viewMonth, onViewMonthChange, onFocusedDateChange],
  );

  const onCellKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, date: Date, outOfMonth: boolean) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(addDays(date, 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(addDays(date, -1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(addDays(date, 7));
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(addDays(date, -7));
          break;
        case 'Home':
          e.preventDefault();
          moveFocus(addDays(date, -date.getDay()));
          break;
        case 'End':
          e.preventDefault();
          moveFocus(addDays(date, 6 - date.getDay()));
          break;
        case 'PageDown':
          e.preventDefault();
          moveFocus(addMonths(date, e.shiftKey ? 12 : 1));
          break;
        case 'PageUp':
          e.preventDefault();
          moveFocus(addMonths(date, e.shiftKey ? -12 : -1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isDayDisabled?.(date)) onDayActivate?.(date, { outOfMonth });
          break;
      }
    },
    [moveFocus, onDayActivate, isDayDisabled],
  );

  const cells = buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth());

  return (
    <div
      role="application"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-col gap-2 rounded-md border border-border bg-popover p-3 text-popover-foreground',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onViewMonthChange(addMonths(viewMonth, -1))}
          className="grid h-7 w-7 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium" aria-live="polite">
          {MONTHS_LONG[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
          className="grid h-7 w-7 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-0 px-1">
        {WEEKDAYS_SHORT.map((w) => (
          <div
            key={w}
            className="grid h-7 w-9 place-items-center text-xs font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div ref={gridRef} className="grid grid-cols-7 gap-0 px-1" role="grid">
        {cells.map(({ date, outOfMonth }) => {
          const disabled = isDayDisabled?.(date) ?? false;
          const isFocusedCell = isSameDay(focusedDate, date);
          const consumerProps = dayProps?.(date, { outOfMonth }) ?? {};
          const { className: cellClassName, ...consumerRest } = consumerProps as Record<
            string,
            unknown
          > & { className?: string };

          return (
            <button
              key={date.toDateString()}
              type="button"
              role="gridcell"
              data-date={date.toDateString()}
              aria-disabled={disabled || undefined}
              data-today={isToday(date) ? '' : undefined}
              data-out-of-month={outOfMonth ? '' : undefined}
              data-disabled={disabled ? '' : undefined}
              tabIndex={isFocusedCell ? 0 : -1}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onDayActivate?.(date, { outOfMonth });
                onFocusedDateChange(date);
                if (outOfMonth) onViewMonthChange(startOfMonth(date));
              }}
              onKeyDown={(e) => onCellKeyDown(e, date, outOfMonth)}
              {...(consumerRest as ButtonHTMLAttributes<HTMLButtonElement>)}
              className={cn(
                'grid h-9 w-9 place-items-center text-sm transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                outOfMonth && 'text-muted-foreground/60',
                disabled && 'pointer-events-none opacity-40',
                cellClassName,
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
