/** Drydock ops crew — deterministic user fixtures. */

export type UserRole =
  | 'owner'
  | 'admin'
  | 'engineer'
  | 'designer'
  | 'support'
  | 'billing'
  | 'viewer';

export type UserStatus = 'online' | 'away' | 'dnd' | 'offline';

/** Constrained hue names — screens map these to theme-safe classes. */
export type AvatarHue =
  | 'slate'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'pink';

export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  role: UserRole;
  initials: string;
  avatarColor: AvatarHue;
  status: UserStatus;
  /** ISO timestamp of last activity — fixed literal. */
  lastSeenAt: string;
}

export const users: User[] = [
  {
    id: 'usr-001',
    name: 'Sora Tanaka',
    handle: 'sora',
    email: 'sora@drydock.dev',
    role: 'owner',
    initials: 'ST',
    avatarColor: 'indigo',
    status: 'online',
    lastSeenAt: '2026-06-12T09:42:00Z',
  },
  {
    id: 'usr-002',
    name: 'Marcus Webb',
    handle: 'mwebb',
    email: 'marcus@drydock.dev',
    role: 'admin',
    initials: 'MW',
    avatarColor: 'blue',
    status: 'online',
    lastSeenAt: '2026-06-12T09:38:00Z',
  },
  {
    id: 'usr-003',
    name: 'Ines Ferreira',
    handle: 'ines',
    email: 'ines@drydock.dev',
    role: 'engineer',
    initials: 'IF',
    avatarColor: 'teal',
    status: 'dnd',
    lastSeenAt: '2026-06-12T09:15:00Z',
  },
  {
    id: 'usr-004',
    name: 'Dmitri Volkov',
    handle: 'dvolkov',
    email: 'dmitri@drydock.dev',
    role: 'engineer',
    initials: 'DV',
    avatarColor: 'violet',
    status: 'online',
    lastSeenAt: '2026-06-12T09:40:00Z',
  },
  {
    id: 'usr-005',
    name: 'Amara Okafor',
    handle: 'amara',
    email: 'amara@drydock.dev',
    role: 'designer',
    initials: 'AO',
    avatarColor: 'pink',
    status: 'away',
    lastSeenAt: '2026-06-12T08:55:00Z',
  },
  {
    id: 'usr-006',
    name: 'Felix Brandt',
    handle: 'fbrandt',
    email: 'felix@drydock.dev',
    role: 'engineer',
    initials: 'FB',
    avatarColor: 'green',
    status: 'offline',
    lastSeenAt: '2026-06-11T22:10:00Z',
  },
  {
    id: 'usr-007',
    name: 'Leila Haddad',
    handle: 'leila',
    email: 'leila@drydock.dev',
    role: 'support',
    initials: 'LH',
    avatarColor: 'amber',
    status: 'online',
    lastSeenAt: '2026-06-12T09:41:00Z',
  },
  {
    id: 'usr-008',
    name: 'Tomás Herrera',
    handle: 'tomas',
    email: 'tomas@drydock.dev',
    role: 'engineer',
    initials: 'TH',
    avatarColor: 'orange',
    status: 'away',
    lastSeenAt: '2026-06-12T07:30:00Z',
  },
  {
    id: 'usr-009',
    name: 'Priya Raman',
    handle: 'priya',
    email: 'priya@drydock.dev',
    role: 'billing',
    initials: 'PR',
    avatarColor: 'red',
    status: 'online',
    lastSeenAt: '2026-06-12T09:20:00Z',
  },
  {
    id: 'usr-010',
    name: 'Jonas Lindqvist',
    handle: 'jonas',
    email: 'jonas@drydock.dev',
    role: 'engineer',
    initials: 'JL',
    avatarColor: 'slate',
    status: 'offline',
    lastSeenAt: '2026-06-10T18:45:00Z',
  },
  {
    id: 'usr-011',
    name: 'Hana Kobayashi',
    handle: 'hana',
    email: 'hana@drydock.dev',
    role: 'support',
    initials: 'HK',
    avatarColor: 'teal',
    status: 'dnd',
    lastSeenAt: '2026-06-12T09:05:00Z',
  },
  {
    id: 'usr-012',
    name: 'Owen Gallagher',
    handle: 'owen',
    email: 'owen@drydock.dev',
    role: 'viewer',
    initials: 'OG',
    avatarColor: 'blue',
    status: 'offline',
    lastSeenAt: '2026-06-09T14:00:00Z',
  },
];

/** id → User lookup (built once from the array above — deterministic). */
export const usersById: Record<string, User> = Object.fromEntries(
  users.map((u) => [u.id, u]),
);
