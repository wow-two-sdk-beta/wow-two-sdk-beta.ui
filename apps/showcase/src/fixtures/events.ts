/** Calendar / gantt / schedule fixtures — fixed dates, June 2026. */

export type EventKind =
  | 'deploy'
  | 'maintenance'
  | 'meeting'
  | 'release'
  | 'oncall'
  | 'review';

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO start (UTC). */
  start: string;
  /** ISO end (UTC). */
  end: string;
  kind: EventKind;
  allDay?: boolean;
  /** References users.ts `User.id`. */
  ownerId: string;
}

export const events: CalendarEvent[] = [
  { id: 'evt-001', title: 'Sprint 24 planning', start: '2026-06-01T09:00:00Z', end: '2026-06-01T10:30:00Z', kind: 'meeting', ownerId: 'usr-001' },
  { id: 'evt-002', title: 'drydock-api v2.7.0 deploy', start: '2026-06-02T10:00:00Z', end: '2026-06-02T11:00:00Z', kind: 'deploy', ownerId: 'usr-004' },
  { id: 'evt-003', title: 'On-call: Felix', start: '2026-06-01T00:00:00Z', end: '2026-06-08T00:00:00Z', kind: 'oncall', allDay: true, ownerId: 'usr-006' },
  { id: 'evt-004', title: 'Design review — onboarding flow', start: '2026-06-04T14:00:00Z', end: '2026-06-04T15:00:00Z', kind: 'review', ownerId: 'usr-005' },
  { id: 'evt-005', title: 'Billing reconciliation (May)', start: '2026-06-05T09:00:00Z', end: '2026-06-05T12:00:00Z', kind: 'meeting', ownerId: 'usr-009' },
  { id: 'evt-006', title: 'CDN cert rotation', start: '2026-06-07T02:00:00Z', end: '2026-06-07T03:00:00Z', kind: 'maintenance', ownerId: 'usr-002' },
  { id: 'evt-007', title: 'On-call: Jonas', start: '2026-06-08T00:00:00Z', end: '2026-06-15T00:00:00Z', kind: 'oncall', allDay: true, ownerId: 'usr-010' },
  { id: 'evt-008', title: 'smart-qr v1.4.0 release', start: '2026-06-11T08:30:00Z', end: '2026-06-11T13:30:00Z', kind: 'release', ownerId: 'usr-004' },
  { id: 'evt-009', title: 'Quarterly security review', start: '2026-06-12T13:00:00Z', end: '2026-06-12T15:00:00Z', kind: 'review', ownerId: 'usr-002' },
  { id: 'evt-010', title: 'Customer call — Kestrel Systems', start: '2026-06-15T11:00:00Z', end: '2026-06-15T11:45:00Z', kind: 'meeting', ownerId: 'usr-007' },
  { id: 'evt-011', title: 'Sprint 24 review + retro', start: '2026-06-15T15:00:00Z', end: '2026-06-15T16:30:00Z', kind: 'meeting', ownerId: 'usr-001' },
  { id: 'evt-012', title: 'DB maintenance — srv-us-1', start: '2026-06-18T02:00:00Z', end: '2026-06-18T04:00:00Z', kind: 'maintenance', ownerId: 'usr-002' },
  { id: 'evt-013', title: 'drydock-api v2.8.1 deploy', start: '2026-06-19T10:00:00Z', end: '2026-06-19T12:00:00Z', kind: 'deploy', ownerId: 'usr-010' },
  { id: 'evt-014', title: 'Roadmap sync — Q3 planning', start: '2026-06-24T09:30:00Z', end: '2026-06-24T11:00:00Z', kind: 'meeting', ownerId: 'usr-001' },
  { id: 'evt-015', title: 'secrets-vault v0.9.0 release', start: '2026-06-26T09:00:00Z', end: '2026-06-26T13:00:00Z', kind: 'release', ownerId: 'usr-003' },
];

export type GanttLane = 'backend' | 'frontend' | 'infra' | 'design';

export interface GanttTask {
  id: string;
  name: string;
  /** Date-only ISO, inclusive. */
  start: string;
  /** Date-only ISO, inclusive. */
  end: string;
  /** 0–100. */
  progress: number;
  lane: GanttLane;
  dependsOn?: string[];
}

/** Q2 wrap-up plan — June 2026. */
export const ganttTasks: GanttTask[] = [
  { id: 'gt-001', name: 'Webhook worker pool fix', start: '2026-06-08', end: '2026-06-12', progress: 90, lane: 'backend' },
  { id: 'gt-002', name: 'smart-qr v1.4.0 release', start: '2026-06-09', end: '2026-06-11', progress: 100, lane: 'backend' },
  { id: 'gt-003', name: 'Onboarding flow redesign', start: '2026-06-02', end: '2026-06-16', progress: 65, lane: 'design' },
  { id: 'gt-004', name: 'Onboarding flow implementation', start: '2026-06-15', end: '2026-06-26', progress: 10, lane: 'frontend', dependsOn: ['gt-003'] },
  { id: 'gt-005', name: 'srv-us-1 storage migration', start: '2026-06-16', end: '2026-06-19', progress: 0, lane: 'infra' },
  { id: 'gt-006', name: 'Usage-based billing v2', start: '2026-06-10', end: '2026-06-24', progress: 40, lane: 'backend' },
  { id: 'gt-007', name: 'Billing v2 dashboard widgets', start: '2026-06-18', end: '2026-06-29', progress: 0, lane: 'frontend', dependsOn: ['gt-006'] },
  { id: 'gt-008', name: 'secrets-vault v0.9.0 hardening', start: '2026-06-15', end: '2026-06-25', progress: 25, lane: 'infra' },
];

export interface ScheduleEntry {
  id: string;
  /** Date-only ISO. */
  day: string;
  /** HH:mm, 24h. */
  startTime: string;
  /** HH:mm, 24h. */
  endTime: string;
  title: string;
  /** References users.ts `User.id`. */
  ownerId: string;
}

/** One day's ops schedule — Friday 2026-06-12. */
export const scheduleEntries: ScheduleEntry[] = [
  { id: 'sch-001', day: '2026-06-12', startTime: '08:00', endTime: '08:30', title: 'Overnight alert review', ownerId: 'usr-010' },
  { id: 'sch-002', day: '2026-06-12', startTime: '09:00', endTime: '09:15', title: 'Standup — platform team', ownerId: 'usr-001' },
  { id: 'sch-003', day: '2026-06-12', startTime: '09:30', endTime: '10:30', title: 'Pool-fix PR pairing', ownerId: 'usr-006' },
  { id: 'sch-004', day: '2026-06-12', startTime: '11:00', endTime: '11:30', title: 'Support handoff sync', ownerId: 'usr-007' },
  { id: 'sch-005', day: '2026-06-12', startTime: '13:00', endTime: '15:00', title: 'Quarterly security review', ownerId: 'usr-002' },
  { id: 'sch-006', day: '2026-06-12', startTime: '15:30', endTime: '16:00', title: 'Release train go/no-go', ownerId: 'usr-004' },
  { id: 'sch-007', day: '2026-06-12', startTime: '16:00', endTime: '17:00', title: 'Docs: rate-limit page rewrite', ownerId: 'usr-005' },
  { id: 'sch-008', day: '2026-06-12', startTime: '17:00', endTime: '17:30', title: 'Weekly metrics snapshot', ownerId: 'usr-009' },
];
