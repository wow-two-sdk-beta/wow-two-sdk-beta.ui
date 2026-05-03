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
  isInRange,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
} from '../_dateUtils';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface RangeCalendarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (range: DateRange) => void;
  defaultMonth?: Date;
  min?: Date | null;
  max?: Date | null;
  isDisabled?: (date: Date) => boolean;
  'aria-label'?: string;
}

export const RangeCalendar = forwardRef<HTMLDivElement, RangeCalendarProps>(
  function RangeCalendar(
    {
      value,
      defaultValue,
      onChange,
      defaultMonth,
      min,
      max,
      isDisabled,
      'aria-label': ariaLabel = 'Date range',
      className,
      ...rest
    },
    ref,
  ) {
    const [range, setRange] = useControlled<DateRange | null>({
      controlled: value,
      default: defaultValue ?? null,
      onChange: onChange as ((v: DateRange | null) => void) | undefined,
    });

    const [viewMonth, setViewMonth] = useState<Date>(
      () => startOfMonth(defaultMonth ?? range?.start ?? new Date()),
    );
    const [focusedDate, setFocusedDate] = useState<Date>(
      () => range?.start ?? new Date(),
    );
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [pendingStart, setPendingStart] = useState<Date | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);

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

    const onSelectDay = useCallback(
      (date: Date) => {
        if (isDateDisabled(date, { min, max, isDisabled })) return;
        if (!pendingStart) {
          setPendingStart(date);
          setRange({ start: date, end: null });
          return;
        }
        // Second click: finalize range. Swap if needed.
        const startTime = startOfDay(pendingStart).getTime();
        const endTime = startOfDay(date).getTime();
        const finalStart = startTime <= endTime ? pendingStart : date;
        const finalEnd = startTime <= endTime ? date : pendingStart;
        setRange({ start: finalStart, end: finalEnd });
        setPendingStart(null);
      },
      [pendingStart, setRange, min, max, isDisabled],
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
            onSelectDay(date);
            break;
        }
      },
      [moveFocus, onSelectDay],
    );

    const cells = buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth());
    const previewEnd = pendingStart ? hoveredDate : range?.end;
    const isStart = (d: Date) => isSameDay(d, range?.start ?? null) || isSameDay(d, pendingStart);
    const isEnd = (d: Date) => isSameDay(d, range?.end ?? null);
    const inRange = (d: Date) => isInRange(d, pendingStart ?? range?.start, previewEnd ?? null);

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

        <div ref={gridRef} className="grid grid-cols-7 gap-0 px-1" role="grid">
          {cells.map(({ date, outOfMonth }) => {
            const disabled = isDateDisabled(date, { min, max, isDisabled });
            const startCell = isStart(date);
            const endCell = isEnd(date);
            const rangeCell = inRange(date) && !startCell && !endCell;
            const isFocusedCell = isSameDay(focusedDate, date);
            return (
              <button
                key={date.toDateString()}
                type="button"
                role="gridcell"
                data-date={date.toDateString()}
                data-range-start={startCell ? '' : undefined}
                data-range-end={endCell ? '' : undefined}
                data-in-range={rangeCell ? '' : undefined}
                data-today={isToday(date) ? '' : undefined}
                data-out-of-month={outOfMonth ? '' : undefined}
                data-disabled={disabled ? '' : undefined}
                aria-selected={startCell || endCell}
                aria-disabled={disabled || undefined}
                tabIndex={isFocusedCell ? 0 : -1}
                disabled={disabled}
                onPointerEnter={() => setHoveredDate(date)}
                onPointerLeave={() => setHoveredDate((h) => (isSameDay(h, date) ? null : h))}
                onClick={() => {
                  onSelectDay(date);
                  setFocusedDate(date);
                  if (outOfMonth) setViewMonth(startOfMonth(date));
                }}
                onKeyDown={(e) => onCellKeyDown(e, date)}
                className={cn(
                  'grid h-9 w-9 place-items-center text-sm transition-colors',
                  'hover:bg-muted hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  outOfMonth && 'text-muted-foreground/60',
                  isToday(date) && !startCell && !endCell && 'border border-border rounded-sm',
                  rangeCell && 'bg-primary-soft text-primary-soft-foreground',
                  startCell && 'bg-primary text-primary-foreground rounded-l-sm',
                  endCell && 'bg-primary text-primary-foreground rounded-r-sm',
                  !startCell && !endCell && !rangeCell && 'rounded-sm',
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
  },
);
