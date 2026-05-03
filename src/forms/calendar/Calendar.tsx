import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  buildMonthGrid,
  isDateDisabled,
  isSameDay,
  isToday,
  startOfMonth,
} from '../_dateUtils';

export interface CalendarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Controlled selected date. */
  value?: Date | null;
  /** Uncontrolled initial selection. */
  defaultValue?: Date | null;
  /** Selection callback. */
  onChange?: (date: Date) => void;
  /** Initial visible month (uncontrolled). */
  defaultMonth?: Date;
  /** Minimum selectable date. */
  min?: Date | null;
  /** Maximum selectable date. */
  max?: Date | null;
  /** Custom disable predicate. */
  isDisabled?: (date: Date) => boolean;
  /** A11y label. */
  'aria-label'?: string;
}

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    value,
    defaultValue,
    onChange,
    defaultMonth,
    min,
    max,
    isDisabled,
    'aria-label': ariaLabel = 'Calendar',
    className,
    ...rest
  },
  ref,
) {
  const [selected, setSelected] = useControlled<Date | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onChange as ((v: Date | null) => void) | undefined,
  });

  const [viewMonth, setViewMonth] = useState<Date>(
    () => startOfMonth(defaultMonth ?? selected ?? new Date()),
  );
  const [focusedDate, setFocusedDate] = useState<Date>(
    () => selected ?? new Date(),
  );
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
      if (next.getMonth() !== viewMonth.getMonth() || next.getFullYear() !== viewMonth.getFullYear()) {
        setViewMonth(startOfMonth(next));
      }
      setFocusedDate(next);
    },
    [viewMonth],
  );

  const onCellKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, date: Date) => {
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
          if (!isDateDisabled(date, { min, max, isDisabled })) {
            setSelected(date);
          }
          break;
      }
    },
    [moveFocus, setSelected, min, max, isDisabled],
  );

  const cells = buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth());

  return (
    <div
      ref={ref}
      role="application"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-col gap-2 rounded-md border border-border bg-popover p-3 text-popover-foreground',
        className,
      )}
      {...rest}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
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
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
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
          const disabled = isDateDisabled(date, { min, max, isDisabled });
          const isSelectedCell = isSameDay(selected, date);
          const isFocusedCell = isSameDay(focusedDate, date);
          return (
            <button
              key={date.toDateString()}
              type="button"
              role="gridcell"
              data-date={date.toDateString()}
              aria-selected={isSelectedCell}
              aria-disabled={disabled || undefined}
              data-selected={isSelectedCell ? '' : undefined}
              data-today={isToday(date) ? '' : undefined}
              data-out-of-month={outOfMonth ? '' : undefined}
              data-disabled={disabled ? '' : undefined}
              tabIndex={isFocusedCell ? 0 : -1}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                setSelected(date);
                setFocusedDate(date);
                if (outOfMonth) setViewMonth(startOfMonth(date));
              }}
              onKeyDown={(e) => onCellKeyDown(e, date)}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-sm text-sm transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                outOfMonth && 'text-muted-foreground/60',
                isToday(date) && !isSelectedCell && 'border border-border',
                isSelectedCell && 'bg-primary text-primary-foreground hover:bg-primary',
                disabled && 'pointer-events-none opacity-40',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
});
