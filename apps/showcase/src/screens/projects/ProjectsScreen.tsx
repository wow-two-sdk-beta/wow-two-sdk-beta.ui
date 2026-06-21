/** Projects screen — task tracker with Table / Board / Timeline / Calendar views. */
import { useMemo, useState } from 'react';
import { Button, SegmentedControl, ToggleButton } from '@wow-two-beta/ui/actions';
import {
  Badge,
  DataTable,
  EmptyState,
  Status,
  SwipeActions,
  Tag,
  type DataTableColumn,
  type DataTableSort,
} from '@wow-two-beta/ui/display';
import { StatusIndicator, useToaster } from '@wow-two-beta/ui/feedback';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  MenuItem,
  MenuSeparator,
  Pagination,
} from '@wow-two-beta/ui/nav';
import {
  projectTasks,
  usersById,
  type ProjectTask,
  type TaskPriority,
  type TaskStatus,
} from '../../fixtures';
import {
  formatDue,
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  TASK_STATUSES,
  USER_STATUS_TONE,
} from './taskMeta';
import { BoardView } from './BoardView';
import { TimelineView } from './TimelineView';
import { CalendarView } from './CalendarView';
import { TaskDrawer } from './TaskDrawer';

type ProjectView = 'table' | 'board' | 'timeline' | 'calendar';

const PAGE_SIZE = 6;

const SORT_ACCESSORS: Record<string, (t: ProjectTask) => string | number> = {
  title: (t) => t.title,
  status: (t) => TASK_STATUSES.indexOf(t.status),
  priority: (t) => PRIORITY_ORDER.indexOf(t.priority),
  due: (t) => t.due ?? '9999-12-31',
};

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

interface TitleCellProps {
  task: ProjectTask;
  onOpen: (task: ProjectTask) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  onArchive: (taskId: string) => void;
}

/** Task title + tags; right-click (or long-press) opens a per-row ContextMenu. */
function TitleCell({ task, onOpen, onMove, onArchive }: TitleCellProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="-m-1 flex flex-col gap-1 rounded-md p-1">
        <span className="font-medium text-foreground">{task.title}</span>
        <span className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </span>
      </ContextMenuTrigger>
      <ContextMenuContent aria-label={`Actions for ${task.title}`}>
        <MenuItem onSelect={() => onOpen(task)}>Open details</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => onMove(task.id, 'in-progress')}>Move to In progress</MenuItem>
        <MenuItem onSelect={() => onMove(task.id, 'in-review')}>Send to review</MenuItem>
        <MenuItem onSelect={() => onMove(task.id, 'done')}>Mark as done</MenuItem>
        <MenuSeparator />
        <MenuItem state="destructive" onSelect={() => onArchive(task.id)}>
          Archive
        </MenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function ProjectsScreen() {
  const { toast } = useToaster();
  const [view, setView] = useState<ProjectView>('table');
  const [tasks, setTasks] = useState<ProjectTask[]>(projectTasks);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [sort, setSort] = useState<DataTableSort | null>({ columnKey: 'due', direction: 'asc' });
  const [page, setPage] = useState(1);

  const moveTask = (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, status } : prev));
    toast({
      title: status === 'done' ? 'Task completed' : `Moved to ${STATUS_META[status].label}`,
      description: task?.title,
      severity: status === 'done' ? 'success' : 'info',
    });
  };

  const archiveTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask((prev) => (prev?.id === taskId ? null : prev));
    toast({ title: 'Task archived', description: task?.title, severity: 'warning' });
  };

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (statusFilter === 'all' || t.status === statusFilter) &&
          (priorityFilter === 'all' || t.priority === priorityFilter),
      ),
    [tasks, statusFilter, priorityFilter],
  );

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const accessor = SORT_ACCESSORS[sort.columnKey];
    if (!accessor) return filtered;
    const next = [...filtered].sort((a, b) => compareValues(accessor(a), accessor(b)));
    return sort.direction === 'asc' ? next : next.reverse();
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const triageRows = tasks
    .filter((t) => t.status === 'in-progress' || t.status === 'in-review')
    .slice(0, 4);

  const columns: DataTableColumn<ProjectTask>[] = [
    {
      key: 'title',
      header: 'Task',
      isSortable: true,
      width: '34%',
      accessor: (t) => t.title,
      cell: (t) => (
        <TitleCell task={t} onOpen={setSelectedTask} onMove={moveTask} onArchive={archiveTask} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      isSortable: true,
      accessor: (t) => TASK_STATUSES.indexOf(t.status),
      cell: (t) => (
        <Status tone={STATUS_META[t.status].tone} size="sm">
          {STATUS_META[t.status].label}
        </Status>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      isSortable: true,
      accessor: (t) => PRIORITY_ORDER.indexOf(t.priority),
      cell: (t) => (
        <Badge size="sm" variant={PRIORITY_META[t.priority].variant}>
          {PRIORITY_META[t.priority].label}
        </Badge>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      cell: (t) => {
        const user = usersById[t.assigneeId];
        if (!user) return t.assigneeId;
        return (
          <StatusIndicator
            tone={USER_STATUS_TONE[user.status]}
            label={user.name}
            description={`@${user.handle} · ${user.role}`}
          />
        );
      },
    },
    {
      key: 'due',
      header: 'Due',
      isSortable: true,
      accessor: (t) => t.due ?? '9999-12-31',
      cell: (t) => <span className="tabular-nums text-muted-foreground">{formatDue(t.due)}</span>,
    },
  ];

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Q2 wrap-up</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tasks · fixtures only, mutations reset on refresh
          </p>
        </div>
        <SegmentedControl
          type="single"
          value={view}
          onValueChange={(v) => {
            if (v) setView(v as ProjectView);
          }}
          aria-label="Project view"
        >
          <ToggleButton value="table">Table</ToggleButton>
          <ToggleButton value="board">Board</ToggleButton>
          <ToggleButton value="timeline">Timeline</ToggleButton>
          <ToggleButton value="calendar">Calendar</ToggleButton>
        </SegmentedControl>
      </div>

      {view === 'table' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Status:</span>
              {TASK_STATUSES.map((status) => (
                <ToggleButton
                  key={status}
                  size="xs"
                  isPressed={statusFilter === status}
                  onPressedChange={(pressed) => {
                    setStatusFilter(pressed ? status : 'all');
                    setPage(1);
                  }}
                >
                  {STATUS_META[status].label}
                </ToggleButton>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Priority:</span>
              {PRIORITY_ORDER.map((priority) => (
                <ToggleButton
                  key={priority}
                  size="xs"
                  isPressed={priorityFilter === priority}
                  onPressedChange={(pressed) => {
                    setPriorityFilter(pressed ? priority : 'all');
                    setPage(1);
                  }}
                >
                  {PRIORITY_META[priority].label}
                </ToggleButton>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No tasks match the filters"
              description={`Nothing is ${statusFilter === 'all' ? 'any status' : STATUS_META[statusFilter].label} + ${priorityFilter === 'all' ? 'any priority' : PRIORITY_META[priorityFilter].label} right now.`}
              actions={
                <Button variant="outline" tone="neutral" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <DataTable
                aria-label="Project tasks"
                columns={columns}
                data={pageRows}
                rowKey={(t) => t.id}
                onRowClick={(t) => setSelectedTask(t)}
                sortBy={sort}
                onSortChange={(next) => {
                  setSort(next);
                  setPage(1);
                }}
                density="comfortable"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {sorted.length} task{sorted.length === 1 ? '' : 's'} · page {currentPage} of{' '}
                  {pageCount} · right-click a task name for actions
                </span>
                <Pagination total={pageCount} page={currentPage} onPageChange={setPage} />
              </div>
            </>
          )}

          <section className="flex flex-col gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Quick triage</h3>
              <p className="text-xs text-muted-foreground">
                Active work — drag a row right to complete, left to archive.
              </p>
            </div>
            {triageRows.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Nothing in progress or in review.
              </p>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {triageRows.map((task) => (
                  <SwipeActions
                    key={task.id}
                    left={
                      <button
                        type="button"
                        onClick={() => moveTask(task.id, 'done')}
                        className="flex h-full w-full items-center justify-center bg-success text-xs font-semibold text-success-foreground"
                      >
                        Done
                      </button>
                    }
                    right={
                      <button
                        type="button"
                        onClick={() => archiveTask(task.id)}
                        className="flex h-full w-full items-center justify-center bg-destructive text-xs font-semibold text-destructive-foreground"
                      >
                        Archive
                      </button>
                    }
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Status tone={STATUS_META[task.status].tone} size="xs" />
                      <span className="flex-1 truncate text-sm text-foreground">{task.title}</span>
                      <Badge size="sm" variant={PRIORITY_META[task.priority].variant}>
                        {PRIORITY_META[task.priority].label}
                      </Badge>
                    </div>
                  </SwipeActions>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {view === 'board' && <BoardView tasks={tasks} onTaskClick={setSelectedTask} />}
      {view === 'timeline' && <TimelineView />}
      {view === 'calendar' && <CalendarView />}

      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onMove={moveTask}
        onArchive={archiveTask}
      />
    </div>
  );
}
