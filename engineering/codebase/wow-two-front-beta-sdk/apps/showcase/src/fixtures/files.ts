/** File / document fixtures — flat list + small tree. Deterministic. */

export type FileKind =
  | 'pdf'
  | 'image'
  | 'spreadsheet'
  | 'doc'
  | 'archive'
  | 'config'
  | 'log'
  | 'code';

export interface FileEntry {
  id: string;
  name: string;
  sizeKb: number;
  kind: FileKind;
  updatedAt: string;
  /** References users.ts `User.id`. */
  ownerId: string;
}

export const files: FileEntry[] = [
  { id: 'file-001', name: 'q2-board-update.pdf', sizeKb: 1_842, kind: 'pdf', updatedAt: '2026-06-10T16:20:00Z', ownerId: 'usr-001' },
  { id: 'file-002', name: 'invoice-export-may.xlsx', sizeKb: 312, kind: 'spreadsheet', updatedAt: '2026-06-02T09:15:00Z', ownerId: 'usr-009' },
  { id: 'file-003', name: 'onboarding-mockups-v3.png', sizeKb: 4_560, kind: 'image', updatedAt: '2026-06-11T13:40:00Z', ownerId: 'usr-005' },
  { id: 'file-004', name: 'incident-ops-441-postmortem.md', sizeKb: 18, kind: 'doc', updatedAt: '2026-06-12T08:50:00Z', ownerId: 'usr-006' },
  { id: 'file-005', name: 'prod-deploy.yaml', sizeKb: 6, kind: 'config', updatedAt: '2026-06-11T07:55:00Z', ownerId: 'usr-004' },
  { id: 'file-006', name: 'webhook-worker-heap.profile.zip', sizeKb: 22_400, kind: 'archive', updatedAt: '2026-06-11T12:00:00Z', ownerId: 'usr-010' },
  { id: 'file-007', name: 'srv-eu-2-rollout.log', sizeKb: 980, kind: 'log', updatedAt: '2026-06-11T11:20:00Z', ownerId: 'usr-006' },
  { id: 'file-008', name: 'rate-limits.md', sizeKb: 9, kind: 'doc', updatedAt: '2026-06-12T08:30:00Z', ownerId: 'usr-005' },
  { id: 'file-009', name: 'billing-v2-schema.sql', sizeKb: 41, kind: 'code', updatedAt: '2026-06-10T14:05:00Z', ownerId: 'usr-003' },
  { id: 'file-010', name: 'security-review-checklist.pdf', sizeKb: 256, kind: 'pdf', updatedAt: '2026-06-09T10:30:00Z', ownerId: 'usr-002' },
  { id: 'file-011', name: 'mrr-by-cohort-2026.xlsx', sizeKb: 488, kind: 'spreadsheet', updatedAt: '2026-06-05T15:10:00Z', ownerId: 'usr-009' },
  { id: 'file-012', name: 'brand-icons-pack.zip', sizeKb: 7_320, kind: 'archive', updatedAt: '2026-05-28T11:45:00Z', ownerId: 'usr-005' },
  { id: 'file-013', name: 'staging-migration-dryrun.log', sizeKb: 134, kind: 'log', updatedAt: '2026-06-11T08:45:00Z', ownerId: 'usr-003' },
  { id: 'file-014', name: 'release-notes-1.4.0.md', sizeKb: 12, kind: 'doc', updatedAt: '2026-06-11T13:05:00Z', ownerId: 'usr-004' },
];

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  /** Present only on files. */
  sizeKb?: number;
  /** Present only on folders. */
  children?: FileTreeNode[];
}

/** Small project-drive tree for tree-view demos. */
export const fileTree: FileTreeNode[] = [
  {
    id: 'node-ops',
    name: 'ops',
    type: 'folder',
    children: [
      {
        id: 'node-incidents',
        name: 'incidents',
        type: 'folder',
        children: [
          { id: 'node-pm-441', name: 'ops-441-postmortem.md', type: 'file', sizeKb: 18 },
          { id: 'node-pm-389', name: 'ops-389-postmortem.md', type: 'file', sizeKb: 24 },
        ],
      },
      {
        id: 'node-runbooks',
        name: 'runbooks',
        type: 'folder',
        children: [
          { id: 'node-rb-deploy', name: 'deploy-train.md', type: 'file', sizeKb: 11 },
          { id: 'node-rb-oncall', name: 'oncall-rotation.md', type: 'file', sizeKb: 7 },
          { id: 'node-rb-db', name: 'db-maintenance.md', type: 'file', sizeKb: 14 },
        ],
      },
      { id: 'node-prod-yaml', name: 'prod-deploy.yaml', type: 'file', sizeKb: 6 },
    ],
  },
  {
    id: 'node-finance',
    name: 'finance',
    type: 'folder',
    children: [
      { id: 'node-inv-may', name: 'invoice-export-may.xlsx', type: 'file', sizeKb: 312 },
      { id: 'node-mrr', name: 'mrr-by-cohort-2026.xlsx', type: 'file', sizeKb: 488 },
    ],
  },
  {
    id: 'node-design',
    name: 'design',
    type: 'folder',
    children: [
      { id: 'node-mockups', name: 'onboarding-mockups-v3.png', type: 'file', sizeKb: 4_560 },
      { id: 'node-icons', name: 'brand-icons-pack.zip', type: 'file', sizeKb: 7_320 },
    ],
  },
  { id: 'node-board', name: 'q2-board-update.pdf', type: 'file', sizeKb: 1_842 },
];
