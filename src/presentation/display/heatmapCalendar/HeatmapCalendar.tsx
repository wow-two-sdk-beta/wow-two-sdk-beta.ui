import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { cn } from '../../../foundation/utils';

// HeatmapCalendar is a date-only surface → its public API is keyed by
// `Temporal.PlainDate` (calendar math, no time zone). Internally the lookup is
// keyed by each date's ISO `.toString()` ("YYYY-MM-DD") so cell values resolve
// in O(1); no native `Date`/raw-string leaks into the API.

export type HeatmapCalendarTone = 'brand' | 'success' | 'warning' | 'danger' | 'muted';

const TONE_CLASSES: Record<HeatmapCalendarTone, string[]> = {
  brand: ['bg-muted/50', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'],
  success: ['bg-muted/50', 'bg-success/20', 'bg-success/40', 'bg-success/70', 'bg-success'],
  warning: ['bg-muted/50', 'bg-warning/20', 'bg-warning/40', 'bg-warning/70', 'bg-warning'],
  danger: ['bg-muted/50', 'bg-destructive/20', 'bg-destructive/40', 'bg-destructive/70', 'bg-destructive'],
  muted: ['bg-muted/30', 'bg-muted', 'bg-muted-foreground/30', 'bg-muted-foreground/60', 'bg-muted-foreground'],
};

export interface HeatmapCalendarProps extends HTMLAttributes<HTMLDivElement> {
  /** Per-day counts, keyed by calendar date. */
  values: Map<Temporal.PlainDate, number>;
  year?: number;
  weekStart?: 0 | 1;
  cellSize?: number;
  gap?: number;
  /** Intensity buckets (min 2, clamped). Buckets map proportionally onto the fixed 5-step tone palette — counts above 5 share palette classes between adjacent buckets. Default 5. */
  levels?: number;
  tone?: HeatmapCalendarTone;
  onCellClick?: (date: Temporal.PlainDate, value: number) => void;
  monthLabels?: string[];
  weekdayLabels?: string[];
  hasLegend?: boolean;
}

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Year-long heatmap. 53 columns (weeks) × 7 rows (weekdays). Per-cell color
 * intensity from `values[YYYY-MM-DD]`, bucketed into `levels` steps.
 */
export const HeatmapCalendar = forwardRef<HTMLDivElement, HeatmapCalendarProps>(
  function HeatmapCalendar(
    {
      values,
      year = Temporal.Now.plainDateISO().year,
      weekStart = 0,
      cellSize = 12,
      gap = 2,
      levels = 5,
      tone = 'brand',
      onCellClick,
      monthLabels = DEFAULT_MONTHS,
      weekdayLabels = DEFAULT_WEEKDAYS,
      hasLegend = true,
      className,
      ...rest
    },
    ref,
  ) {
    // Re-key the PlainDate-keyed API onto ISO strings ("YYYY-MM-DD") for O(1)
    // lookup during the grid walk (PlainDate is not usable as a Map identity key).
    const valueMap = useMemo(() => {
      const map = new Map<string, number>();
      for (const [date, value] of values) map.set(date.toString(), value);
      return map;
    }, [values]);

    const { columns, monthMarkers, maxValue } = useMemo(() => {
      const start = Temporal.PlainDate.from({ year, month: 1, day: 1 });
      const end = Temporal.PlainDate.from({ year, month: 12, day: 31 });
      // Walk back to first weekStart day before/at year start.
      // Temporal `dayOfWeek`: 1 (Mon) … 7 (Sun); map to a Sunday=0 index.
      const sundayIdx = start.dayOfWeek % 7;
      const offset = (sundayIdx - weekStart + 7) % 7;
      let cur = start.subtract({ days: offset });

      const cols: Array<Array<{ date: Temporal.PlainDate; key: string; inYear: boolean; value: number }>> = [];
      let column: Array<{ date: Temporal.PlainDate; key: string; inYear: boolean; value: number }> = [];
      const months: Array<{ month: number; col: number }> = [];
      let lastSeenMonth = -1;
      let max = 0;

      while (Temporal.PlainDate.compare(cur, end) <= 0 || column.length > 0) {
        const inYear = cur.year === year;
        const key = cur.toString();
        const v = valueMap.get(key) ?? 0;
        if (v > max) max = v;
        column.push({ date: cur, key, inYear, value: v });

        // Temporal `month` is 1-indexed; keep the 0-indexed marker the labels expect.
        if (inYear && cur.month - 1 !== lastSeenMonth) {
          lastSeenMonth = cur.month - 1;
          months.push({ month: cur.month - 1, col: cols.length });
        }

        if (column.length === 7) {
          cols.push(column);
          column = [];
        }
        cur = cur.add({ days: 1 });
        if (Temporal.PlainDate.compare(cur, end) > 0 && column.length === 0) break;
      }
      if (column.length > 0) cols.push(column);
      return { columns: cols, monthMarkers: months, maxValue: max };
    }, [year, weekStart, valueMap]);

    const toneSteps = TONE_CLASSES[tone];
    /* Clamp to ≥2 so the zero step plus at least one filled step always exist. */
    const levelCount = Math.max(2, Math.floor(levels));
    const bucket = (v: number): number => {
      if (v <= 0 || maxValue === 0) return 0;
      const idx = Math.ceil((v / maxValue) * (levelCount - 1));
      return Math.min(levelCount - 1, idx);
    };
    /* The palette is a fixed 5-step ramp; map any bucket count onto it proportionally (0 → empty step, top bucket → full tone, nonzero buckets never fall back to the empty step). */
    const stepClass = (level: number): string => {
      if (level === 0) return toneSteps[0]!;
      const idx = Math.round((level / (levelCount - 1)) * (toneSteps.length - 1));
      return toneSteps[Math.max(1, idx)]!;
    };

    const totalWidth = columns.length * (cellSize + gap);
    const colHeight = 7 * (cellSize + gap);

    // Order weekdays starting from weekStart.
    const weekdayOrder = Array.from({ length: 7 }, (_, i) => weekdayLabels[(i + weekStart) % 7]!);

    return (
      <div ref={ref} className={cn('inline-block', className)} {...rest}>
        {/* Month labels */}
        <div className="relative ml-8" style={{ height: cellSize, width: totalWidth }}>
          {monthMarkers.map(({ month, col }) => (
            <span
              key={month}
              className="absolute text-[10px] uppercase text-muted-foreground"
              style={{ left: col * (cellSize + gap) }}
            >
              {monthLabels[month]}
            </span>
          ))}
        </div>
        <div className="flex" style={{ gap }}>
          {/* Weekday labels — show every other to avoid clutter. */}
          <div
            className="flex flex-col text-[10px] uppercase text-muted-foreground"
            style={{ width: 28, gap, height: colHeight }}
          >
            {weekdayOrder.map((wd, i) => (
              <span
                key={i}
                className={i % 2 === 0 ? 'opacity-0' : ''}
                style={{ height: cellSize, lineHeight: `${cellSize}px` }}
              >
                {wd}
              </span>
            ))}
          </div>
          {/* Grid */}
          <div className="flex" style={{ gap }}>
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col" style={{ gap }}>
                {col.map((cell, rowIdx) => {
                  const level = bucket(cell.value);
                  const interactive = cell.inYear && onCellClick != null;
                  const Tag: 'button' | 'div' = interactive ? 'button' : 'div';
                  return (
                    <Tag
                      key={rowIdx}
                      type={interactive ? 'button' : undefined}
                      aria-label={`${cell.key}: ${cell.value}`}
                      aria-valuenow={level}
                      aria-valuemin={0}
                      aria-valuemax={levelCount - 1}
                      onClick={interactive ? () => onCellClick?.(cell.date, cell.value) : undefined}
                      style={{ width: cellSize, height: cellSize }}
                      className={cn(
                        'rounded-[2px] transition-colors',
                        cell.inYear ? stepClass(level) : 'bg-transparent',
                        interactive && 'cursor-pointer hover:ring-1 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {hasLegend && (
          <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            {toneSteps.map((cls, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{ width: cellSize, height: cellSize }}
                className={cn('rounded-[2px]', cls)}
              />
            ))}
            <span>More</span>
          </div>
        )}
      </div>
    );
  },
);
