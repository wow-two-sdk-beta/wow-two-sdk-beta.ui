/** Activity feed + project task fixtures. Deterministic. */

export type ActivityVerb =
  | 'deployed'
  | 'merged'
  | 'commented'
  | 'created'
  | 'closed'
  | 'paid'
  | 'invited'
  | 'updated'
  | 'restarted'
  | 'archived';

export interface ActivityItem {
  id: string;
  /** References users.ts `User.id`. */
  actorId: string;
  verb: ActivityVerb;
  /** Human-readable target, e.g. "smart-qr v1.4.0 → production". */
  target: string;
  at: string;
  read: boolean;
}

export const activityItems: ActivityItem[] = [
  { id: 'act-001', actorId: 'usr-004', verb: 'deployed', target: 'smart-qr v1.4.0 → production', at: '2026-06-11T13:02:00Z', read: true },
  { id: 'act-002', actorId: 'usr-003', verb: 'merged', target: 'PR #482 — billing v2 schema', at: '2026-06-10T14:10:00Z', read: true },
  { id: 'act-003', actorId: 'usr-006', verb: 'created', target: 'incident OPS-441', at: '2026-06-11T11:18:00Z', read: true },
  { id: 'act-004', actorId: 'usr-010', verb: 'commented', target: 'incident OPS-441', at: '2026-06-11T12:02:00Z', read: true },
  { id: 'act-005', actorId: 'usr-009', verb: 'paid', target: 'invoice INV-2026-0117 — Granite Capital', at: '2026-05-13T11:30:00Z', read: true },
  { id: 'act-006', actorId: 'usr-002', verb: 'updated', target: 'maintenance window — srv-us-1 (Jun 18)', at: '2026-06-12T07:15:00Z', read: false },
  { id: 'act-007', actorId: 'usr-001', verb: 'invited', target: 'owen@drydock.dev as viewer', at: '2026-06-09T14:05:00Z', read: true },
  { id: 'act-008', actorId: 'usr-007', verb: 'closed', target: 'ticket SUP-1208 — webhook delays', at: '2026-06-11T10:20:00Z', read: true },
  { id: 'act-009', actorId: 'usr-006', verb: 'restarted', target: 'webhook-worker pool (3 nodes)', at: '2026-06-11T09:55:00Z', read: true },
  { id: 'act-010', actorId: 'usr-005', verb: 'updated', target: 'docs/rate-limits.md → 120 rpm', at: '2026-06-12T08:30:00Z', read: false },
  { id: 'act-011', actorId: 'usr-010', verb: 'created', target: 'PR #491 — cap webhook pool at 50', at: '2026-06-12T08:02:00Z', read: false },
  { id: 'act-012', actorId: 'usr-006', verb: 'commented', target: 'PR #491 — cap webhook pool at 50', at: '2026-06-12T08:31:00Z', read: false },
  { id: 'act-013', actorId: 'usr-003', verb: 'deployed', target: 'staging migration dry-run', at: '2026-06-11T08:47:00Z', read: true },
  { id: 'act-014', actorId: 'usr-009', verb: 'updated', target: 'dunning schedule — Copperline Mfg', at: '2026-06-11T11:45:00Z', read: true },
  { id: 'act-015', actorId: 'usr-002', verb: 'archived', target: 'project legacy-qr-redirector', at: '2026-06-08T10:00:00Z', read: true },
  { id: 'act-016', actorId: 'usr-005', verb: 'created', target: 'Figma — onboarding flow v3', at: '2026-06-11T13:40:00Z', read: true },
  { id: 'act-017', actorId: 'usr-008', verb: 'updated', target: '@wow-two-beta/ui → beta.12 in showcase', at: '2026-06-12T06:40:00Z', read: false },
  { id: 'act-018', actorId: 'usr-011', verb: 'closed', target: 'ticket SUP-1196 — export CSV encoding', at: '2026-06-10T16:55:00Z', read: true },
  { id: 'act-019', actorId: 'usr-001', verb: 'created', target: 'Q3 roadmap draft', at: '2026-06-12T09:10:00Z', read: false },
  { id: 'act-020', actorId: 'usr-004', verb: 'updated', target: 'release train — Friday 10:00 UTC', at: '2026-06-12T09:00:00Z', read: false },
];

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  /** References users.ts `User.id`. */
  assigneeId: string;
  /** Date-only ISO, or null if unscheduled. */
  due: string | null;
  priority: TaskPriority;
  tags: string[];
}

export const projectTasks: ProjectTask[] = [
  { id: 'tsk-001', title: 'Cap webhook worker pool at 50 connections', status: 'in-review', assigneeId: 'usr-010', due: '2026-06-13', priority: 'urgent', tags: ['backend', 'incident'] },
  { id: 'tsk-002', title: 'Write OPS-441 postmortem', status: 'in-progress', assigneeId: 'usr-006', due: '2026-06-15', priority: 'high', tags: ['ops', 'docs'] },
  { id: 'tsk-003', title: 'Implement onboarding flow v3', status: 'todo', assigneeId: 'usr-008', due: '2026-06-26', priority: 'high', tags: ['frontend', 'onboarding'] },
  { id: 'tsk-004', title: 'Finalize onboarding mockups', status: 'in-review', assigneeId: 'usr-005', due: '2026-06-16', priority: 'medium', tags: ['design', 'onboarding'] },
  { id: 'tsk-005', title: 'Usage-based billing v2 — metering service', status: 'in-progress', assigneeId: 'usr-003', due: '2026-06-24', priority: 'high', tags: ['backend', 'billing'] },
  { id: 'tsk-006', title: 'Billing v2 dashboard widgets', status: 'backlog', assigneeId: 'usr-008', due: '2026-06-29', priority: 'medium', tags: ['frontend', 'billing'] },
  { id: 'tsk-007', title: 'srv-us-1 storage migration runbook', status: 'todo', assigneeId: 'usr-002', due: '2026-06-17', priority: 'high', tags: ['infra'] },
  { id: 'tsk-008', title: 'Rotate stale API tokens (quarterly)', status: 'todo', assigneeId: 'usr-002', due: '2026-06-30', priority: 'medium', tags: ['security'] },
  { id: 'tsk-009', title: 'Update rate-limit docs to 120 rpm', status: 'done', assigneeId: 'usr-005', due: '2026-06-12', priority: 'low', tags: ['docs'] },
  { id: 'tsk-010', title: 'Dunning flow for overdue invoices', status: 'in-progress', assigneeId: 'usr-009', due: '2026-06-20', priority: 'medium', tags: ['billing'] },
  { id: 'tsk-011', title: 'SSO-on-Team plan — scoping doc', status: 'backlog', assigneeId: 'usr-001', due: null, priority: 'low', tags: ['product', 'q3'] },
  { id: 'tsk-012', title: 'secrets-vault v0.9.0 threat model', status: 'todo', assigneeId: 'usr-003', due: '2026-06-23', priority: 'high', tags: ['security', 'infra'] },
  { id: 'tsk-013', title: 'Canary dashboard — add saturation alert', status: 'todo', assigneeId: 'usr-010', due: '2026-06-18', priority: 'medium', tags: ['observability'] },
  { id: 'tsk-014', title: 'Archive legacy-qr-redirector repo assets', status: 'done', assigneeId: 'usr-002', due: '2026-06-08', priority: 'low', tags: ['ops', 'cleanup'] },
];
