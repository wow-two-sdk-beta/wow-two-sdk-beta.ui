/** Timeline view — Gantt chart over the June 2026 wrap-up plan fixtures. */
import { Gantt, Tag } from '@wow-two-beta/ui/display';
import { useToaster } from '@wow-two-beta/ui/feedback';
import { ganttTasks, type GanttLane } from '../../fixtures';
import { parseDateOnly } from './taskMeta';

const LANE_VARIANT: Record<GanttLane, 'brand' | 'success' | 'warning' | 'info'> = {
  backend: 'brand',
  frontend: 'info',
  infra: 'warning',
  design: 'success',
};

const chartTasks = ganttTasks.map((t) => ({
  id: t.id,
  label: t.name,
  start: parseDateOnly(t.start),
  end: parseDateOnly(t.end),
  progress: t.progress / 100,
}));

const chartDependencies = ganttTasks.flatMap((t) =>
  (t.dependsOn ?? []).map((from) => ({ from, to: t.id })),
);

const chartMilestones = [
  { id: 'ms-release', label: 'smart-qr v1.4.0', date: parseDateOnly('2026-06-11') },
];

export function TimelineView() {
  const { toast } = useToaster();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Lanes:</span>
        {(Object.keys(LANE_VARIANT) as GanttLane[]).map((lane) => (
          <Tag key={lane} variant={LANE_VARIANT[lane]}>
            {lane} · {ganttTasks.filter((t) => t.lane === lane).length}
          </Tag>
        ))}
      </div>
      <Gantt
        tasks={chartTasks}
        dependencies={chartDependencies}
        milestones={chartMilestones}
        from={parseDateOnly('2026-06-01')}
        to={parseDateOnly('2026-06-30')}
        cellWidth={34}
        onTaskClick={(task) => {
          const source = ganttTasks.find((t) => t.id === task.id);
          toast({
            title: typeof task.label === 'string' ? task.label : task.id,
            description: source ? `${source.lane} · ${source.progress}% complete` : undefined,
            severity: 'info',
          });
        }}
      />
      <p className="text-xs text-muted-foreground">
        Diamond = release milestone · arrows = dependencies (design → build, billing v2 → widgets).
      </p>
    </div>
  );
}
