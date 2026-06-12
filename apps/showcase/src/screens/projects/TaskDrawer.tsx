/** Task detail Drawer + ActionSheet for status mutations. Fully controlled. */
import { useState } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import { Badge, DescriptionList, Status, Tag } from '@wow-two-beta/ui/display';
import {
  ActionSheet,
  ActionSheetAction,
  ActionSheetCancel,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@wow-two-beta/ui/overlays';
import { usersById, type ProjectTask, type TaskStatus } from '../../fixtures';
import { formatDue, PRIORITY_META, STATUS_META, USER_STATUS_TONE } from './taskMeta';

export interface TaskDrawerProps {
  task: ProjectTask | null;
  onClose: () => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  onArchive: (taskId: string) => void;
}

export function TaskDrawer({ task, onClose, onMove, onArchive }: TaskDrawerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!task) return null;

  const assignee = usersById[task.assigneeId];
  const statusMeta = STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];

  const close = () => {
    setSheetOpen(false);
    onClose();
  };

  return (
    <>
      <Drawer
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
        side="right"
      >
        <DrawerContent size="md">
          <DrawerClose />
          <DrawerHeader>
            <DrawerTitle>{task.title}</DrawerTitle>
            <DrawerDescription>
              {task.id} · {statusMeta.label}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-5">
            <DescriptionList
              layout="inline"
              density="md"
              items={[
                {
                  label: 'Status',
                  value: <Status tone={statusMeta.tone}>{statusMeta.label}</Status>,
                },
                {
                  label: 'Priority',
                  value: <Badge variant={priorityMeta.variant}>{priorityMeta.label}</Badge>,
                },
                {
                  label: 'Assignee',
                  value: assignee ? (
                    <Status tone={USER_STATUS_TONE[assignee.status]} size="sm">
                      {assignee.name} · @{assignee.handle}
                    </Status>
                  ) : (
                    task.assigneeId
                  ),
                },
                { label: 'Due', value: formatDue(task.due) },
                { label: 'Task ID', value: <code className="text-xs">{task.id}</code> },
              ]}
            />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <Tag key={tag} variant="brand">
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              Fixture-backed detail panel — mutations below update local state only and reset on
              refresh.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" tone="neutral" onClick={close}>
              Close
            </Button>
            <Button onClick={() => setSheetOpen(true)}>Actions…</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Task actions"
        description={task.title}
      >
        <ActionSheetAction
          onSelect={() => {
            onMove(task.id, 'in-progress');
            close();
          }}
        >
          Move to In progress
        </ActionSheetAction>
        <ActionSheetAction
          onSelect={() => {
            onMove(task.id, 'in-review');
            close();
          }}
        >
          Send to review
        </ActionSheetAction>
        <ActionSheetAction
          onSelect={() => {
            onMove(task.id, 'done');
            close();
          }}
        >
          Mark as done
        </ActionSheetAction>
        <ActionSheetAction
          destructive
          onSelect={() => {
            onArchive(task.id);
            close();
          }}
        >
          Archive task
        </ActionSheetAction>
        <ActionSheetCancel />
      </ActionSheet>
    </>
  );
}
