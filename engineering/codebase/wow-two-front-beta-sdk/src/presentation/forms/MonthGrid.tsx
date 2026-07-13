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
import { Temporal } from 'temporal-polyfill';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../foundation/utils';
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  buildMonthGrid,
  isSameDay,
  isToday,
  startOfMonth,
  sundayIndex,
} from './DateExtensions';

export interface MonthGridDayProps
  extends Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'className' | 'onPointerEnter' | 'onPointerLeave' | 'aria-selected'
  > {
  /** The extra `data-*` attributes (data-selected, data-range-start, etc.). */
  [key: `data-${string}`]: string | boolean | undefined;
}

export interface MonthGridProps {
  /** The first day of the visible month (use `startOfMonth(date)`). */
  viewMonth: Temporal.PlainDate;

  /** Emits the new visible month when prev/next steps it. */
  onViewMonthChange: (date: Temporal.PlainDate) => void;

  /** The currently focused day (cell tabIndex=0). */
  focusedDate: Temporal.PlainDate;

  /** Emits the newly focused day from keyboard navigation. */
  onFocusedDateChange: (date: Temporal.PlainDate) => void;

  /** The predicate marking a day as disabled. */
  isDayDisabled?: (date: Temporal.PlainDate) => boolean;

  /** Emits the activated day on click / Enter / Space. */
  onDayActivate?: (date: Temporal.PlainDate, meta: { outOfMonth: boolean }) => void;

  /** The extra per-day attributes for selection styling and hover handlers. */
  dayProps?: (
    date: Temporal.PlainDate,
    meta: { outOfMonth: boolean },
  ) => MonthGridDayProps | undefined;
  'aria-label'?: string;
  className?: string;
}

// Upper bound when scanning past disabled days — covers a Shift+PageUp/PageDown
// year jump (≤366 days) with margin.
const MAX_DISABLED_SKIP = 400;

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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Tracks keyboard/click interaction so the focus effect below never steals
  // page focus when a standalone Calendar mounts.
  const interactedRef = useRef(false);

  // Re-focus the active day cell when focusedDate changes (keyboard nav).
  useEffect(() => {
    if (!interactedRef.current) return;
    const cell = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${focusedDate.toString()}"]`,
    );
    cell?.focus();
  }, [focusedDate]);

  // When the grid mounts inside an open popover (DatePicker), the focus trap
  // lands on the first tabbable (prev-month button); adopt it onto the active
  // day cell. Standalone mounts (activeElement outside the root) are left alone.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (!rootRef.current?.contains(document.activeElement)) return;
      gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const moveFocus = useCallback(
    (next: Temporal.PlainDate, dir: 1 | -1) => {
      let target = next;
      if (isDayDisabled) {
        // Skip disabled days in the movement direction…
        let steps = 0;
        while (isDayDisabled(target) && steps < MAX_DISABLED_SKIP) {
          target = addDays(target, dir);
          steps += 1;
        }
        // …and clamp back toward the origin when none exist (min/max edges).
        if (isDayDisabled(target)) {
          target = next;
          steps = 0;
          while (isDayDisabled(target) && steps < MAX_DISABLED_SKIP) {
            target = addDays(target, -dir);
            steps += 1;
          }
        }
        if (isDayDisabled(target)) return; // nothing focusable in reach — stay put
      }
      interactedRef.current = true;
      if (target.month !== viewMonth.month || target.year !== viewMonth.year) {
        onViewMonthChange(startOfMonth(target));
      }
      onFocusedDateChange(target);
    },
    [isDayDisabled, viewMonth, onViewMonthChange, onFocusedDateChange],
  );

  const onCellKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, date: Temporal.PlainDate, outOfMonth: boolean) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(addDays(date, 1), 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(addDays(date, -1), -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(addDays(date, 7), 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(addDays(date, -7), -1);
          break;
        case 'Home':
          // Scan toward the origin so a disabled week start clamps to the
          // first enabled day of the week instead of leaving it.
          e.preventDefault();
          moveFocus(addDays(date, -sundayIndex(date)), 1);
          break;
        case 'End':
          e.preventDefault();
          moveFocus(addDays(date, 6 - sundayIndex(date)), -1);
          break;
        case 'PageDown':
          e.preventDefault();
          moveFocus(addMonths(date, e.shiftKey ? 12 : 1), 1);
          break;
        case 'PageUp':
          e.preventDefault();
          moveFocus(addMonths(date, e.shiftKey ? -12 : -1), -1);
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

  const dayDisabled = (date: Temporal.PlainDate) => isDayDisabled?.(date) ?? false;
  const cells = buildMonthGrid(viewMonth.year, viewMonth.month);
  const weeks = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  // Roving tab stop — the focused date unless it's disabled (e.g. today before
  // `min`); then the first enabled cell so the grid stays Tab-reachable.
  let tabStopDate = focusedDate;
  if (dayDisabled(focusedDate)) {
    const fallback =
      cells.find((c) => !c.outOfMonth && !dayDisabled(c.date)) ??
      cells.find((c) => !dayDisabled(c.date));
    if (fallback) tabStopDate = fallback.date;
  }

  return (
    <div
      ref={rootRef}
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
          {MONTHS_LONG[viewMonth.month - 1]} {viewMonth.year}
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
      <div ref={gridRef} role="grid" aria-label={ariaLabel} className="px-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="grid grid-cols-7 gap-0">
            {week.map(({ date, outOfMonth }) => {
              const disabled = dayDisabled(date);
              const isTabStop = isSameDay(tabStopDate, date);
              const consumerProps = dayProps?.(date, { outOfMonth }) ?? {};
              const { className: cellClassName, ...consumerRest } = consumerProps as Record<
                string,
                unknown
              > & { className?: string };

              return (
                <button
                  key={date.toString()}
                  type="button"
                  role="gridcell"
                  data-date={date.toString()}
                  aria-disabled={disabled || undefined}
                  data-today={isToday(date) ? '' : undefined}
                  data-out-of-month={outOfMonth ? '' : undefined}
                  data-disabled={disabled ? '' : undefined}
                  tabIndex={isTabStop ? 0 : -1}
                  onClick={() => {
                    if (disabled) return;
                    interactedRef.current = true;
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
                  {date.day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
