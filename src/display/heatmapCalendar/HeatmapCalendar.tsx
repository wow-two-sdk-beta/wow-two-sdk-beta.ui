import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { cn } from '../../utils';

export type HeatmapCalendarTone = 'brand' | 'success' | 'warning' | 'danger' | 'muted';

const TONE_CLASSES: Record<HeatmapCalendarTone, string[]> = {
  brand: ['bg-muted/50', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'],
  success: ['bg-muted/50', 'bg-success/20', 'bg-success/40', 'bg-success/70', 'bg-success'],
  warning: ['bg-muted/50', 'bg-warning/20', 'bg-warning/40', 'bg-warning/70', 'bg-warning'],
  danger: ['bg-muted/50', 'bg-destructive/20', 'bg-destructive/40', 'bg-destructive/70', 'bg-destructive'],
  muted: ['bg-muted/30', 'bg-muted', 'bg-muted-foreground/30', 'bg-muted-foreground/60', 'bg-muted-foreground'],
};

export interface HeatmapCalendarProps extends HTMLAttributes<HTMLDivElement> {
  values: Record<string, number> | Map<string, number>;
  year?: number;
  weekStart?: 0 | 1;
  cellSize?: number;
  gap?: number;
  levels?: number;
  tone?: HeatmapCalendarTone;
  onCellClick?: (date: string, value: number) => void;
  monthLabels?: string[];
  weekdayLabels?: string[];
  showLegend?: boolean;
}

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Year-long heatmap. 53 columns (weeks) × 7 rows (weekdays). Per-cell color
 * intensity from `values[YYYY-MM-DD]`, bucketed into `levels` steps.
 */
export const HeatmapCalendar = forwardRef<HTMLDivElement, HeatmapCalendarProps>(
  function HeatmapCalendar(
    {
      values,
      year = new Date().getFullYear(),
      weekStart = 0,
      cellSize = 12,
      gap = 2,
      levels = 5,
      tone = 'brand',
      onCellClick,
      monthLabels = DEFAULT_MONTHS,
      weekdayLabels = DEFAULT_WEEKDAYS,
      showLegend = true,
      className,
      ...rest
    },
    ref,
  ) {
    const valueMap = useMemo(() => {
      if (values instanceof Map) return values;
      return new Map(Object.entries(values));
    }, [values]);

    const { columns, monthMarkers, maxValue } = useMemo(() => {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      // Walk back to first weekStart day before/at year start.
      const cur = new Date(start);
      const wd = cur.getDay();
      const offset = (wd - weekStart + 7) % 7;
      cur.setDate(cur.getDate() - offset);

      const cols: Array<Array<{ date: Date; inYear: boolean; value: number }>> = [];
      let column: Array<{ date: Date; inYear: boolean; value: number }> = [];
      const months: Array<{ month: number; col: number }> = [];
      let lastSeenMonth = -1;
      let max = 0;

      while (cur <= end || column.length > 0) {
        const inYear = cur.getFullYear() === year;
        const key = formatDate(cur);
        const v = valueMap.get(key) ?? 0;
        if (v > max) max = v;
        column.push({ date: new Date(cur), inYear, value: v });

        if (inYear && cur.getMonth() !== lastSeenMonth) {
          lastSeenMonth = cur.getMonth();
          months.push({ month: cur.getMonth(), col: cols.length });
        }

        if (column.length === 7) {
          cols.push(column);
          column = [];
        }
        cur.setDate(cur.getDate() + 1);
        if (cur > end && column.length === 0) break;
      }
      if (column.length > 0) cols.push(column);
      return { columns: cols, monthMarkers: months, maxValue: max };
    }, [year, weekStart, valueMap]);

    const toneSteps = TONE_CLASSES[tone];
    const bucket = (v: number): number => {
      if (v <= 0 || maxValue === 0) return 0;
      const idx = Math.ceil((v / maxValue) * (levels - 1));
      return Math.min(levels - 1, idx);
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
                  const dateStr = formatDate(cell.date);
                  const level = bucket(cell.value);
                  const interactive = cell.inYear && onCellClick != null;
                  const Tag: 'button' | 'div' = interactive ? 'button' : 'div';
                  return (
                    <Tag
                      key={rowIdx}
                      type={interactive ? 'button' : undefined}
                      aria-label={`${dateStr}: ${cell.value}`}
                      aria-valuenow={level}
                      aria-valuemin={0}
                      aria-valuemax={levels - 1}
                      onClick={interactive ? () => onCellClick?.(dateStr, cell.value) : undefined}
                      style={{ width: cellSize, height: cellSize }}
                      className={cn(
                        'rounded-[2px] transition-colors',
                        cell.inYear ? toneSteps[level] : 'bg-transparent',
                        interactive && 'cursor-pointer hover:ring-1 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {showLegend && (
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
