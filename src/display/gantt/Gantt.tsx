import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface GanttTask {
  id: string;
  label: ReactNode;
  start: Date;
  end: Date;
  color?: string;
  /** 0..1 — fills the bar from the left. */
  progress?: number;
}

export interface GanttDependency {
  from: string;
  to: string;
}

export interface GanttMilestone {
  id: string;
  label: ReactNode;
  date: Date;
}

export interface GanttProps extends HTMLAttributes<HTMLDivElement> {
  tasks: GanttTask[];
  dependencies?: GanttDependency[];
  milestones?: GanttMilestone[];
  from?: Date;
  to?: Date;
  cellWidth?: number;
  rowHeight?: number;
  labelWidth?: number;
  showWeekends?: boolean;
  onTaskClick?: (task: GanttTask) => void;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDayLocal(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDayLocal(b).getTime() - startOfDayLocal(a).getTime()) / MS_PER_DAY);
}

function* eachDay(from: Date, to: Date): Generator<Date> {
  const cur = startOfDayLocal(from);
  const end = startOfDayLocal(to);
  while (cur <= end) {
    yield new Date(cur);
    cur.setDate(cur.getDate() + 1);
  }
}

/**
 * First-generation Gantt chart. Tasks rendered as horizontal bars positioned
 * by start/end. Optional dependency arrows + "today" indicator. Drag-resize,
 * drag-move, critical path, group rows all deferred.
 */
export const Gantt = forwardRef<HTMLDivElement, GanttProps>(function Gantt(
  {
    tasks,
    dependencies = [],
    milestones = [],
    from: fromProp,
    to: toProp,
    cellWidth = 40,
    rowHeight = 36,
    labelWidth = 200,
    showWeekends = true,
    onTaskClick,
    className,
    ...rest
  },
  ref,
) {
  const { from, to, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return { from: now, to: now, totalDays: 1 };
    }
    const minStart = fromProp ?? new Date(Math.min(...tasks.map((t) => t.start.getTime())));
    const maxEnd = toProp ?? new Date(Math.max(...tasks.map((t) => t.end.getTime())));
    return {
      from: startOfDayLocal(minStart),
      to: startOfDayLocal(maxEnd),
      totalDays: dayDiff(minStart, maxEnd) + 1,
    };
  }, [tasks, fromProp, toProp]);

  const headerDates = useMemo(() => Array.from(eachDay(from, to)), [from, to]);
  const today = startOfDayLocal(new Date());
  const todayOffset = dayDiff(from, today);
  const todayInRange = todayOffset >= 0 && todayOffset < totalDays;

  const taskIndex = useMemo(() => new Map(tasks.map((t, i) => [t.id, i])), [tasks]);

  const timelineWidth = totalDays * cellWidth;

  return (
    <div
      ref={ref}
      role="grid"
      aria-label="Gantt chart"
      className={cn('overflow-auto rounded-md border border-border bg-card text-sm shadow-sm', className)}
      {...rest}
    >
      <div className="flex">
        {/* Label column */}
        <div className="shrink-0 border-r border-border bg-muted/30" style={{ width: labelWidth }}>
          <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground" style={{ height: rowHeight }}>
            Task
          </div>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center border-b border-border px-3 text-xs last:border-b-0"
              style={{ height: rowHeight }}
            >
              <span className="truncate font-medium">{task.label}</span>
            </div>
          ))}
        </div>
        {/* Timeline */}
        <div className="relative flex-1 overflow-x-auto" style={{ minWidth: 0 }}>
          <div style={{ width: timelineWidth }}>
            {/* Header */}
            <div className="flex border-b border-border" style={{ height: rowHeight }}>
              {headerDates.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isFirstOfMonth = d.getDate() === 1;
                return (
                  <div
                    key={i}
                    className={cn(
                      'border-r border-border text-[10px] tabular-nums',
                      isWeekend && showWeekends && 'bg-muted/40',
                      isFirstOfMonth && 'border-l-2 border-l-border-strong',
                    )}
                    style={{ width: cellWidth }}
                  >
                    {isFirstOfMonth && (
                      <div className="border-b border-border bg-muted px-1 py-0.5 text-center font-medium text-muted-foreground">
                        {d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                      </div>
                    )}
                    <div className="px-1 py-0.5 text-center text-muted-foreground">
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Rows */}
            {tasks.map((task) => {
              const offset = dayDiff(from, task.start);
              const length = Math.max(1, dayDiff(task.start, task.end) + 1);
              const left = offset * cellWidth;
              const width = length * cellWidth;
              const progress = task.progress ?? 0;
              return (
                <div
                  key={task.id}
                  className="relative border-b border-border last:border-b-0"
                  style={{ height: rowHeight }}
                >
                  {/* Vertical day gridlines + weekend shading */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {headerDates.map((d, i) => {
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div
                          key={i}
                          style={{ width: cellWidth }}
                          className={cn(
                            'border-r border-border/60',
                            isWeekend && showWeekends && 'bg-muted/30',
                          )}
                        />
                      );
                    })}
                  </div>
                  {/* Bar */}
                  <button
                    type="button"
                    role="button"
                    aria-label={`${typeof task.label === 'string' ? task.label : task.id}: ${task.start.toLocaleDateString()} – ${task.end.toLocaleDateString()}`}
                    onClick={() => onTaskClick?.(task)}
                    style={{
                      left: left + 4,
                      width: width - 8,
                      top: 6,
                      bottom: 6,
                      background: task.color,
                    }}
                    className={cn(
                      'absolute overflow-hidden rounded-md border border-border/60 px-2 text-left text-[11px] font-medium transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      !task.color && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {/* Progress fill */}
                    {progress > 0 && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 bg-foreground/20"
                        style={{ width: `${progress * 100}%` }}
                      />
                    )}
                    <span className="relative inline-flex h-full items-center truncate">
                      {task.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
          {/* Dependency arrows + today line */}
          <svg
            className="pointer-events-none absolute"
            style={{
              left: 0,
              top: rowHeight,
              width: timelineWidth,
              height: tasks.length * rowHeight,
            }}
          >
            {dependencies.map((dep, i) => {
              const fromIdx = taskIndex.get(dep.from);
              const toIdx = taskIndex.get(dep.to);
              if (fromIdx == null || toIdx == null) return null;
              const fromTask = tasks[fromIdx]!;
              const toTask = tasks[toIdx]!;
              const fromX = (dayDiff(from, fromTask.end) + 1) * cellWidth;
              const fromY = fromIdx * rowHeight + rowHeight / 2;
              const toX = dayDiff(from, toTask.start) * cellWidth;
              const toY = toIdx * rowHeight + rowHeight / 2;
              const midX = Math.max(fromX + 8, (fromX + toX) / 2);
              const path = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX - 4} ${toY}`;
              return (
                <g key={i}>
                  <path d={path} fill="none" stroke="currentColor" strokeWidth={1} className="text-border-strong" />
                  <polygon
                    points={`${toX - 4},${toY - 3} ${toX - 4},${toY + 3} ${toX},${toY}`}
                    className="fill-border-strong"
                  />
                </g>
              );
            })}
            {milestones.map((m) => {
              const x = dayDiff(from, m.date) * cellWidth + cellWidth / 2;
              return (
                <g key={m.id}>
                  <polygon
                    points={`${x},2 ${x + 6},10 ${x},18 ${x - 6},10`}
                    className="fill-warning stroke-warning-foreground"
                    strokeWidth={1}
                  />
                </g>
              );
            })}
            {todayInRange && (
              <line
                x1={todayOffset * cellWidth + cellWidth / 2}
                x2={todayOffset * cellWidth + cellWidth / 2}
                y1={0}
                y2={tasks.length * rowHeight}
                className="stroke-primary"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
});
