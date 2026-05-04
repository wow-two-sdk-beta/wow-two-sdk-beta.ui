import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { isDateDisabled, isSameDay, isToday, startOfMonth } from '../DateExtensions';
import { MonthGrid } from '../MonthGrid';

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
  const [focusedDate, setFocusedDate] = useState<Date>(() => selected ?? new Date());

  return (
    <div ref={ref} className={cn(className)} {...rest}>
      <MonthGrid
        viewMonth={viewMonth}
        onViewMonthChange={setViewMonth}
        focusedDate={focusedDate}
        onFocusedDateChange={setFocusedDate}
        isDayDisabled={(d) => isDateDisabled(d, { min, max, isDisabled })}
        onDayActivate={(d) => setSelected(d)}
        dayProps={(date) => {
          const isSelectedCell = isSameDay(selected, date);
          return {
            'aria-selected': isSelectedCell,
            'data-selected': isSelectedCell ? '' : undefined,
            className: cn(
              'rounded-sm',
              isToday(date) && !isSelectedCell && 'border border-border',
              isSelectedCell && 'bg-primary text-primary-foreground hover:bg-primary',
            ),
          };
        }}
        aria-label={ariaLabel}
      />
    </div>
  );
});
