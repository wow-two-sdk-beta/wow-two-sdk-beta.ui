import { forwardRef, useState, type HTMLAttributes } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { isDateDisabled, isSameDay, isToday, startOfMonth, today } from '../DateExtensions';
import { MonthGrid } from '../MonthGrid';

export interface CalendarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Controlled selected date. */
  value?: Temporal.PlainDate | null;
  /** Uncontrolled initial selection. */
  defaultValue?: Temporal.PlainDate | null;
  /** Selection callback. */
  onValueChange?: (date: Temporal.PlainDate) => void;
  /** Initial visible month (uncontrolled). */
  defaultMonth?: Temporal.PlainDate;
  /** Minimum selectable date. */
  min?: Temporal.PlainDate | null;
  /** Maximum selectable date. */
  max?: Temporal.PlainDate | null;
  /** Custom disable predicate. */
  isDisabled?: (date: Temporal.PlainDate) => boolean;
  /** A11y label. */
  'aria-label'?: string;
}

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    value,
    defaultValue,
    onValueChange,
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
  const [selected, setSelected] = useControlled<Temporal.PlainDate | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onValueChange as ((v: Temporal.PlainDate | null) => void) | undefined,
  });
  const [viewMonth, setViewMonth] = useState<Temporal.PlainDate>(
    () => startOfMonth(defaultMonth ?? selected ?? today()),
  );
  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => selected ?? today());

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
