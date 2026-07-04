/** Shared meta maps + date helpers for the Projects screen. Deterministic. */
import { Temporal } from '@js-temporal/polyfill';
import type { TaskPriority, TaskStatus, UserStatus } from '../../fixtures';

const LOCAL_TZ = Temporal.Now.timeZoneId();

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

/** Parse a date-only ISO string ('2026-06-12') as a calendar date. */
export function parseDateOnly(iso: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso);
}

/** Combine a date-only ISO day + 'HH:mm' into a LOCAL-zone instant. */
export function parseDateTime(day: string, hhmm: string): Temporal.ZonedDateTime {
  const [h = 0, min = 0] = hhmm.split(':').map(Number);
  return parseDateOnly(day).toZonedDateTime({
    timeZone: LOCAL_TZ,
    plainTime: new Temporal.PlainTime(h, min),
  });
}

export function formatDue(due: string | null): string {
  if (!due) return 'Unscheduled';
  return parseDateOnly(due).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
