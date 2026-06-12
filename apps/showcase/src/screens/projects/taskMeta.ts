/** Shared meta maps + date helpers for the Projects screen. Deterministic. */
import type { TaskPriority, TaskStatus, UserStatus } from '../../fixtures';

export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'neutral';
export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];

export const STATUS_META: Record<TaskStatus, { label: string; tone: StatusTone }> = {
  backlog: { label: 'Backlog', tone: 'neutral' },
  todo: { label: 'To do', tone: 'info' },
  'in-progress': { label: 'In progress', tone: 'warning' },
  'in-review': { label: 'In review', tone: 'info' },
  done: { label: 'Done', tone: 'success' },
};

export const PRIORITY_ORDER: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export const PRIORITY_META: Record<TaskPriority, { label: string; variant: BadgeVariant }> = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
};

export const USER_STATUS_TONE: Record<UserStatus, StatusTone> = {
  online: 'success',
  away: 'warning',
  dnd: 'destructive',
  offline: 'neutral',
};

/** Parse a date-only ISO string ('2026-06-12') as a LOCAL date. */
export function parseDateOnly(iso: string): Date {
  const [y = 2026, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Combine a date-only ISO day + 'HH:mm' into a LOCAL Date. */
export function parseDateTime(day: string, hhmm: string): Date {
  const base = parseDateOnly(day);
  const [h = 0, min = 0] = hhmm.split(':').map(Number);
  base.setHours(h, min, 0, 0);
  return base;
}

export function formatDue(due: string | null): string {
  if (!due) return 'Unscheduled';
  return parseDateOnly(due).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
