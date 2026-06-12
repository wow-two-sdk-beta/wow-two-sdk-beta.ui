/** Chat fixtures — 2 channels × ~15 messages + one thread. Deterministic. */

export interface Channel {
  id: string;
  name: string;
  topic: string;
  memberIds: string[];
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Message {
  id: string;
  channelId: string;
  /** References users.ts `User.id`. */
  authorId: string;
  text: string;
  sentAt: string;
  reactions: Reaction[];
  edited?: boolean;
}

export interface ThreadReply {
  id: string;
  authorId: string;
  text: string;
  sentAt: string;
}

export interface Thread {
  /** Message the thread hangs off (must exist in `messages`). */
  rootMessageId: string;
  replies: ThreadReply[];
}

export const channels: Channel[] = [
  {
    id: 'ch-deploys',
    name: 'deploys',
    topic: 'Release coordination & deploy announcements',
    memberIds: ['usr-001', 'usr-002', 'usr-003', 'usr-004', 'usr-006', 'usr-008', 'usr-010'],
  },
  {
    id: 'ch-support',
    name: 'support',
    topic: 'Customer escalations & ticket triage',
    memberIds: ['usr-001', 'usr-005', 'usr-007', 'usr-009', 'usr-011', 'usr-012'],
  },
];

export const messages: Message[] = [
  // #deploys — 2026-06-11 → 2026-06-12
  {
    id: 'msg-d-001',
    channelId: 'ch-deploys',
    authorId: 'usr-004',
    text: 'Kicking off the smart-qr v1.4.0 release train. Freeze starts in 30 min.',
    sentAt: '2026-06-11T08:30:00Z',
    reactions: [{ emoji: '🚀', count: 3, userIds: ['usr-001', 'usr-002', 'usr-003'] }],
  },
  {
    id: 'msg-d-002',
    channelId: 'ch-deploys',
    authorId: 'usr-003',
    text: 'Migration dry-run passed on staging — 14 statements, 2.1s total.',
    sentAt: '2026-06-11T08:47:00Z',
    reactions: [{ emoji: '✅', count: 2, userIds: ['usr-004', 'usr-002'] }],
  },
  {
    id: 'msg-d-003',
    channelId: 'ch-deploys',
    authorId: 'usr-002',
    text: 'Reminder: secrets-vault rotation job runs at 12:00 UTC, hold deploys during the window.',
    sentAt: '2026-06-11T09:05:00Z',
    reactions: [],
  },
  {
    id: 'msg-d-004',
    channelId: 'ch-deploys',
    authorId: 'usr-006',
    text: 'drydock-api canary at 5% — error rate flat, latency p95 162ms.',
    sentAt: '2026-06-11T10:12:00Z',
    reactions: [{ emoji: '👀', count: 1, userIds: ['usr-010'] }],
  },
  {
    id: 'msg-d-005',
    channelId: 'ch-deploys',
    authorId: 'usr-010',
    text: 'Bumping canary to 25%. Watching the dashboards.',
    sentAt: '2026-06-11T10:40:00Z',
    reactions: [],
  },
  {
    id: 'msg-d-006',
    channelId: 'ch-deploys',
    authorId: 'usr-006',
    text: 'srv-eu-2 showed a memory spike during rollout — self-recovered, filed OPS-441 to track.',
    sentAt: '2026-06-11T11:18:00Z',
    reactions: [{ emoji: '🔍', count: 2, userIds: ['usr-004', 'usr-002'] }],
  },
  {
    id: 'msg-d-007',
    channelId: 'ch-deploys',
    authorId: 'usr-004',
    text: 'Canary at 100%. smart-qr v1.4.0 is live. Release notes going out.',
    sentAt: '2026-06-11T13:02:00Z',
    reactions: [
      { emoji: '🎉', count: 5, userIds: ['usr-001', 'usr-002', 'usr-003', 'usr-006', 'usr-010'] },
      { emoji: '🚢', count: 2, userIds: ['usr-008', 'usr-005'] },
    ],
  },
  {
    id: 'msg-d-008',
    channelId: 'ch-deploys',
    authorId: 'usr-001',
    text: 'Nice work everyone. Post-release checklist owner this round: @ines.',
    sentAt: '2026-06-11T13:10:00Z',
    reactions: [{ emoji: '🫡', count: 1, userIds: ['usr-003'] }],
  },
  {
    id: 'msg-d-009',
    channelId: 'ch-deploys',
    authorId: 'usr-008',
    text: 'Heads up: bumping the shared UI lib to beta.12 across showcase apps tomorrow.',
    sentAt: '2026-06-11T15:25:00Z',
    reactions: [],
  },
  {
    id: 'msg-d-010',
    channelId: 'ch-deploys',
    authorId: 'usr-003',
    text: 'Post-release checks done: dashboards green, no new Sentry groups, synthetic probes passing.',
    sentAt: '2026-06-11T16:48:00Z',
    reactions: [{ emoji: '✅', count: 3, userIds: ['usr-001', 'usr-004', 'usr-010'] }],
  },
  {
    id: 'msg-d-011',
    channelId: 'ch-deploys',
    authorId: 'usr-002',
    text: 'Scheduling DB maintenance for srv-us-1 on Jun 18, 02:00–04:00 UTC. Calendar invite sent.',
    sentAt: '2026-06-12T07:15:00Z',
    reactions: [],
  },
  {
    id: 'msg-d-012',
    channelId: 'ch-deploys',
    authorId: 'usr-010',
    text: 'OPS-441 root cause: connection pool not capped on the new worker. Fix in review.',
    sentAt: '2026-06-12T08:02:00Z',
    reactions: [{ emoji: '🙌', count: 2, userIds: ['usr-006', 'usr-004'] }],
    edited: true,
  },
  {
    id: 'msg-d-013',
    channelId: 'ch-deploys',
    authorId: 'usr-006',
    text: 'Reviewed and approved. Ship it with the next train.',
    sentAt: '2026-06-12T08:31:00Z',
    reactions: [],
  },
  {
    id: 'msg-d-014',
    channelId: 'ch-deploys',
    authorId: 'usr-004',
    text: 'Next train is Friday 10:00 UTC — drydock-api v2.8.1 + the pool fix.',
    sentAt: '2026-06-12T09:00:00Z',
    reactions: [{ emoji: '👍', count: 2, userIds: ['usr-002', 'usr-010'] }],
  },
  {
    id: 'msg-d-015',
    channelId: 'ch-deploys',
    authorId: 'usr-001',
    text: 'Approved. Keep the canary window at 2h this time.',
    sentAt: '2026-06-12T09:18:00Z',
    reactions: [],
  },

  // #support — 2026-06-11 → 2026-06-12
  {
    id: 'msg-s-001',
    channelId: 'ch-support',
    authorId: 'usr-007',
    text: 'Acme Robotics reports webhook deliveries delayed ~4 min since 09:00. Ticket SUP-1208.',
    sentAt: '2026-06-11T09:22:00Z',
    reactions: [{ emoji: '👀', count: 1, userIds: ['usr-011'] }],
  },
  {
    id: 'msg-s-002',
    channelId: 'ch-support',
    authorId: 'usr-011',
    text: 'Seeing the same from Polar Metrics. Queue depth on webhook workers is elevated.',
    sentAt: '2026-06-11T09:31:00Z',
    reactions: [],
  },
  {
    id: 'msg-s-003',
    channelId: 'ch-support',
    authorId: 'usr-001',
    text: 'Escalating to on-call. @dvolkov can you take a look?',
    sentAt: '2026-06-11T09:35:00Z',
    reactions: [],
  },
  {
    id: 'msg-s-004',
    channelId: 'ch-support',
    authorId: 'usr-007',
    text: 'On-call confirmed a stuck consumer — restart rolled out, queue draining.',
    sentAt: '2026-06-11T09:58:00Z',
    reactions: [{ emoji: '✅', count: 2, userIds: ['usr-001', 'usr-011'] }],
  },
  {
    id: 'msg-s-005',
    channelId: 'ch-support',
    authorId: 'usr-011',
    text: 'Backlog cleared at 10:14. Posting a status-page update and closing SUP-1208.',
    sentAt: '2026-06-11T10:20:00Z',
    reactions: [{ emoji: '🎉', count: 1, userIds: ['usr-007'] }],
  },
  {
    id: 'msg-s-006',
    channelId: 'ch-support',
    authorId: 'usr-009',
    text: 'Copperline Mfg invoice INV-2026-0109 is 30 days overdue — second reminder sent today.',
    sentAt: '2026-06-11T11:45:00Z',
    reactions: [],
  },
  {
    id: 'msg-s-007',
    channelId: 'ch-support',
    authorId: 'usr-005',
    text: 'New onboarding flow mockups are in Figma — affects the getting-started emails support links to.',
    sentAt: '2026-06-11T13:40:00Z',
    reactions: [{ emoji: '🎨', count: 2, userIds: ['usr-007', 'usr-012'] }],
  },
  {
    id: 'msg-s-008',
    channelId: 'ch-support',
    authorId: 'usr-007',
    text: 'Tundra Games asks about SSO on the Team plan. Current answer: Enterprise only — confirm?',
    sentAt: '2026-06-11T14:55:00Z',
    reactions: [],
  },
  {
    id: 'msg-s-009',
    channelId: 'ch-support',
    authorId: 'usr-001',
    text: 'Confirmed, Enterprise only for now. SSO-on-Team is on the Q3 roadmap.',
    sentAt: '2026-06-11T15:08:00Z',
    reactions: [{ emoji: '👍', count: 1, userIds: ['usr-007'] }],
  },
  {
    id: 'msg-s-010',
    channelId: 'ch-support',
    authorId: 'usr-011',
    text: 'Weekly triage done: 17 open, 5 waiting-on-customer, 0 unassigned. Oldest is SUP-1183 (12 days).',
    sentAt: '2026-06-11T17:30:00Z',
    reactions: [{ emoji: '📊', count: 1, userIds: ['usr-001'] }],
  },
  {
    id: 'msg-s-011',
    channelId: 'ch-support',
    authorId: 'usr-012',
    text: 'FYI the docs page on API rate limits still shows the old 60 rpm figure.',
    sentAt: '2026-06-12T07:50:00Z',
    reactions: [],
  },
  {
    id: 'msg-s-012',
    channelId: 'ch-support',
    authorId: 'usr-005',
    text: 'Good catch — fixing the docs page this morning, new limit is 120 rpm.',
    sentAt: '2026-06-12T08:05:00Z',
    reactions: [{ emoji: '🙏', count: 1, userIds: ['usr-012'] }],
    edited: true,
  },
  {
    id: 'msg-s-013',
    channelId: 'ch-support',
    authorId: 'usr-009',
    text: 'Emberlight Studio settled INV-2026-0116 minus late fee — flagging for finance review.',
    sentAt: '2026-06-12T08:40:00Z',
    reactions: [],
  },
  {
    id: 'msg-s-014',
    channelId: 'ch-support',
    authorId: 'usr-007',
    text: 'Orchid Health card keeps failing (INV-2026-0106). Sent them the update-payment-method link.',
    sentAt: '2026-06-12T09:12:00Z',
    reactions: [],
  },
  {
    id: 'msg-s-015',
    channelId: 'ch-support',
    authorId: 'usr-011',
    text: 'Quiet morning otherwise — 2 new tickets, both docs questions.',
    sentAt: '2026-06-12T09:35:00Z',
    reactions: [{ emoji: '☕', count: 2, userIds: ['usr-007', 'usr-005'] }],
  },
];

/** Thread hanging off the OPS-441 memory-spike message in #deploys. */
export const thread: Thread = {
  rootMessageId: 'msg-d-006',
  replies: [
    {
      id: 'thr-001',
      authorId: 'usr-004',
      text: 'Was that the same node that flapped during the May 28 rollout?',
      sentAt: '2026-06-11T11:25:00Z',
    },
    {
      id: 'thr-002',
      authorId: 'usr-006',
      text: 'Different node, same worker image. Pattern points at the image, not hardware.',
      sentAt: '2026-06-11T11:33:00Z',
    },
    {
      id: 'thr-003',
      authorId: 'usr-010',
      text: 'Heap profile attached to OPS-441 — pool grows unbounded under burst traffic.',
      sentAt: '2026-06-11T12:02:00Z',
    },
    {
      id: 'thr-004',
      authorId: 'usr-002',
      text: 'Cap it at 50 and add a saturation alert. Anything above that is a scaling problem, not a pool problem.',
      sentAt: '2026-06-11T12:15:00Z',
    },
    {
      id: 'thr-005',
      authorId: 'usr-010',
      text: 'Agreed. PR up tomorrow morning.',
      sentAt: '2026-06-11T12:20:00Z',
    },
    {
      id: 'thr-006',
      authorId: 'usr-006',
      text: 'Resolution noted in the main channel — closing the thread.',
      sentAt: '2026-06-12T08:35:00Z',
    },
  ],
};
