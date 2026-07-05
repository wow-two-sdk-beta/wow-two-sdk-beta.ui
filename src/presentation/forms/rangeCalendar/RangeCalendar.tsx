import { forwardRef, useState, type HTMLAttributes } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { isDateDisabled, isInRange, isSameDay, isToday, startOfMonth, today } from '../DateExtensions';
import { MonthGrid } from '../MonthGrid';

/** A completed date range. Both ends are set; the in-progress state is internal. */
export interface DateRange {
  start: Temporal.PlainDate;
  end: Temporal.PlainDate;
}

export interface RangeCalendarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange) => void;
  defaultMonth?: Temporal.PlainDate;
  min?: Temporal.PlainDate | null;
  max?: Temporal.PlainDate | null;
  isDisabled?: (date: Temporal.PlainDate) => boolean;
  'aria-label'?: string;
}

export const RangeCalendar = forwardRef<HTMLDivElement, RangeCalendarProps>(
  function RangeCalendar(
    {
      value,
      defaultValue,
      onValueChange,
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
      onChange: onValueChange as ((v: DateRange | null) => void) | undefined,
    });
    const [viewMonth, setViewMonth] = useState<Temporal.PlainDate>(
      () => startOfMonth(defaultMonth ?? range?.start ?? today()),
    );
    const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(
      () => range?.start ?? today(),
    );
    const [hoveredDate, setHoveredDate] = useState<Temporal.PlainDate | null>(null);
    const [pendingStart, setPendingStart] = useState<Temporal.PlainDate | null>(null);

    const handleActivate = (date: Temporal.PlainDate) => {
      if (!pendingStart) {
        // First click opens a pending range; the public value clears until both
        // ends are set (a `DateRange` always carries a real start and end).
        setPendingStart(date);
        setRange(null);
        return;
      }
      const forward = Temporal.PlainDate.compare(pendingStart, date) <= 0;
      const finalStart = forward ? pendingStart : date;
      const finalEnd = forward ? date : pendingStart;
      setRange({ start: finalStart, end: finalEnd });
      setPendingStart(null);
    };

    const previewEnd = pendingStart ? hoveredDate : (range?.end ?? null);
    const isStart = (d: Temporal.PlainDate) =>
      isSameDay(d, range?.start ?? null) || isSameDay(d, pendingStart);
    const isEnd = (d: Temporal.PlainDate) => isSameDay(d, range?.end ?? null);
    const inRange = (d: Temporal.PlainDate) =>
      isInRange(d, pendingStart ?? range?.start, previewEnd);

    return (
      <div ref={ref} className={cn(className)} {...rest}>
        <MonthGrid
          viewMonth={viewMonth}
          onViewMonthChange={setViewMonth}
          focusedDate={focusedDate}
          onFocusedDateChange={setFocusedDate}
          isDayDisabled={(d) => isDateDisabled(d, { min, max, isDisabled })}
          onDayActivate={handleActivate}
          dayProps={(date) => {
            const startCell = isStart(date);
            const endCell = isEnd(date);
            const rangeCell = inRange(date) && !startCell && !endCell;
            const selected = startCell || endCell;
            return {
              'aria-selected': selected,
              'data-range-start': startCell ? '' : undefined,
              'data-range-end': endCell ? '' : undefined,
              'data-in-range': rangeCell ? '' : undefined,
              onPointerEnter: () => setHoveredDate(date),
              onPointerLeave: () =>
                setHoveredDate((h) => (isSameDay(h, date) ? null : h)),
              className: cn(
                isToday(date) && !startCell && !endCell && 'border border-border rounded-sm',
                rangeCell && 'bg-primary-soft text-primary-soft-foreground',
                startCell && 'bg-primary text-primary-foreground rounded-l-sm',
                endCell && 'bg-primary text-primary-foreground rounded-r-sm',
                !startCell && !endCell && !rangeCell && 'rounded-sm',
              ),
            };
          }}
          aria-label={ariaLabel}
        />
      </div>
    );
  },
);
