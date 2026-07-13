/** Billing fixtures — invoices for Drydock-hosted products. Deterministic. */

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'refunded'
  | 'failed';

export interface OrderItem {
  sku: string;
  description: string;
  qty: number;
  unitUsd: number;
}

export interface Order {
  id: string;
  customer: string;
  customerEmail: string;
  /** Sum of items (qty × unitUsd), rounded to cents. */
  amountUsd: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const order = (
  id: string,
  customer: string,
  customerEmail: string,
  status: OrderStatus,
  createdAt: string,
  items: OrderItem[],
): Order => ({
  id,
  customer,
  customerEmail,
  status,
  createdAt,
  items,
  amountUsd: round2(items.reduce((sum, i) => sum + i.qty * i.unitUsd, 0)),
});

const seats = (qty: number): OrderItem => ({
  sku: 'addon-seats',
  description: 'Additional seats',
  qty,
  unitUsd: 12,
});

const planPro: OrderItem = {
  sku: 'plan-pro',
  description: 'Pro plan (monthly)',
  qty: 1,
  unitUsd: 49,
};

const planTeam: OrderItem = {
  sku: 'plan-team',
  description: 'Team plan (monthly)',
  qty: 1,
  unitUsd: 199,
};

const planEnterprise: OrderItem = {
  sku: 'plan-enterprise',
  description: 'Enterprise plan (annual)',
  qty: 1,
  unitUsd: 4_800,
};

const overage = (qty: number): OrderItem => ({
  sku: 'usage-overage',
  description: 'API overage (per 10k calls)',
  qty,
  unitUsd: 2.5,
});

const support: OrderItem = {
  sku: 'addon-priority-support',
  description: 'Priority support',
  qty: 1,
  unitUsd: 99,
};

export const orders: Order[] = [
  order('INV-2026-0101', 'Acme Robotics', 'ap@acmerobotics.io', 'paid', '2026-01-08T10:12:00Z', [planTeam, seats(4)]),
  order('INV-2026-0102', 'Nimbus Labs', 'billing@nimbuslabs.co', 'paid', '2026-01-15T14:03:00Z', [planPro, overage(6)]),
  order('INV-2026-0103', 'Vector Freight', 'finance@vectorfreight.com', 'refunded', '2026-01-22T09:45:00Z', [planPro]),
  order('INV-2026-0104', 'Bluefin Analytics', 'ops@bluefin.dev', 'paid', '2026-02-03T11:30:00Z', [planTeam, support]),
  order('INV-2026-0105', 'Kestrel Systems', 'accounts@kestrel.sys', 'paid', '2026-02-11T16:20:00Z', [planEnterprise]),
  order('INV-2026-0106', 'Orchid Health', 'billing@orchidhealth.app', 'failed', '2026-02-18T08:05:00Z', [planPro, seats(2)]),
  order('INV-2026-0107', 'Tundra Games', 'pay@tundragames.gg', 'paid', '2026-02-25T19:40:00Z', [planTeam, overage(14)]),
  order('INV-2026-0108', 'Meridian Legal', 'ap@meridianlegal.com', 'paid', '2026-03-04T10:00:00Z', [planPro]),
  order('INV-2026-0109', 'Copperline Mfg', 'finance@copperline.io', 'overdue', '2026-03-12T13:15:00Z', [planTeam, seats(8), support]),
  order('INV-2026-0110', 'Halcyon Media', 'billing@halcyon.media', 'paid', '2026-03-19T15:55:00Z', [planPro, overage(3)]),
  order('INV-2026-0111', 'Quill & Co', 'accounts@quillco.com', 'paid', '2026-03-27T09:10:00Z', [planPro, seats(1)]),
  order('INV-2026-0112', 'Sable Security', 'ap@sablesec.io', 'paid', '2026-04-02T12:25:00Z', [planEnterprise, support]),
  order('INV-2026-0113', 'Driftwood Travel', 'billing@driftwood.travel', 'pending', '2026-04-10T17:35:00Z', [planPro]),
  order('INV-2026-0114', 'Lattice Foods', 'finance@latticefoods.com', 'paid', '2026-04-17T08:50:00Z', [planTeam, overage(9)]),
  order('INV-2026-0115', 'Polar Metrics', 'ops@polarmetrics.dev', 'paid', '2026-04-24T14:42:00Z', [planTeam, seats(6)]),
  order('INV-2026-0116', 'Emberlight Studio', 'pay@emberlight.studio', 'overdue', '2026-05-05T10:18:00Z', [planPro, seats(3)]),
  order('INV-2026-0117', 'Granite Capital', 'ap@granitecap.com', 'paid', '2026-05-13T11:05:00Z', [planEnterprise]),
  order('INV-2026-0118', 'Wavelength Audio', 'billing@wavelength.fm', 'paid', '2026-05-21T16:30:00Z', [planPro, overage(11)]),
  order('INV-2026-0119', 'Cinder Works', 'finance@cinderworks.io', 'pending', '2026-06-03T09:22:00Z', [planTeam, support]),
  order('INV-2026-0120', 'Aurora Logistics', 'ap@auroralogistics.com', 'draft', '2026-06-10T13:48:00Z', [planTeam, seats(10), overage(4)]),
];

export const orderStatuses: OrderStatus[] = [
  'draft',
  'pending',
  'paid',
  'overdue',
  'refunded',
  'failed',
];
