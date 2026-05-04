import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import {
  isDateDisabled,
  isInRange,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
} from '../DateExtensions';
import { MonthGrid } from '../MonthGrid';

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
    const [focusedDate, setFocusedDate] = useState<Date>(() => range?.start ?? new Date());
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [pendingStart, setPendingStart] = useState<Date | null>(null);

    const handleActivate = (date: Date) => {
      if (!pendingStart) {
        setPendingStart(date);
        setRange({ start: date, end: null });
        return;
      }
      const startTime = startOfDay(pendingStart).getTime();
      const endTime = startOfDay(date).getTime();
      const finalStart = startTime <= endTime ? pendingStart : date;
      const finalEnd = startTime <= endTime ? date : pendingStart;
      setRange({ start: finalStart, end: finalEnd });
      setPendingStart(null);
    };

    const previewEnd = pendingStart ? hoveredDate : range?.end;
    const isStart = (d: Date) =>
      isSameDay(d, range?.start ?? null) || isSameDay(d, pendingStart);
    const isEnd = (d: Date) => isSameDay(d, range?.end ?? null);
    const inRange = (d: Date) =>
      isInRange(d, pendingStart ?? range?.start, previewEnd ?? null);

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
