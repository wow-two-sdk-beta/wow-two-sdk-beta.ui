/** Board view — card columns per status with CountBadge headers. */
import { Badge, Card, CountBadge } from '@wow-two-beta/ui/display';
import { usersById, type ProjectTask } from '../../fixtures';
import { formatDue, PRIORITY_META, STATUS_META, TASK_STATUSES } from './taskMeta';

export interface BoardViewProps {
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
}

export function BoardView({ tasks, onTaskClick }: BoardViewProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {TASK_STATUSES.map((status) => {
        const column = tasks.filter((t) => t.status === status);
        return (
          <Card key={status} className="flex flex-col">
            <Card.Header className="flex flex-row items-center justify-between gap-2">
              <Card.Title className="text-sm">{STATUS_META[status].label}</Card.Title>
              <CountBadge value={column.length} hideZero={false} variant="neutral" />
            </Card.Header>
            <Card.Body className="flex flex-1 flex-col gap-2">
              {column.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">
                  No tasks
                </p>
              ) : (
                column.map((task) => {
                  const assignee = usersById[task.assigneeId];
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onTaskClick(task)}
                      className="rounded-md border border-border bg-background p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="text-xs font-medium text-foreground">{task.title}</div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <Badge size="sm" variant={PRIORITY_META[task.priority].variant}>
                          {PRIORITY_META[task.priority].label}
                        </Badge>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {assignee?.name ?? task.assigneeId} · {formatDue(task.due)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
