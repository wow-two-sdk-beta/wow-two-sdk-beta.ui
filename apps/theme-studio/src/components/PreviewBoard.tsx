import { useState } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import {
  Badge,
  Card,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Tag,
} from '@wow-two-beta/ui/display';
import { Select, TextInput } from '@wow-two-beta/ui/forms';
import { Alert, Banner } from '@wow-two-beta/ui/feedback';

const ROWS = [
  { id: 'INV-1024', plan: 'Pro', status: 'Paid', amount: '$120.00' },
  { id: 'INV-1025', plan: 'Team', status: 'Pending', amount: '$340.00' },
  { id: 'INV-1026', plan: 'Free', status: 'Refunded', amount: '$0.00' },
];

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  Paid: 'success',
  Pending: 'warning',
  Refunded: 'danger',
};

/* A representative product screen built entirely from real lib components and
   theme tokens — the canonical "how does this theme feel" surface. Local state
   only (Select + input), no props: the surrounding wrapper decides the theme. */
export function PreviewBoard() {
  const [plan, setPlan] = useState<string | null>('pro');

  return (
    <div className="flex flex-col gap-5">
      {/* Banner spanning the top */}
      <Banner
        severity="info"
        title="Trial ends in 5 days"
        description="Upgrade to keep your workspace and unlock advanced analytics."
        actions={
          <Button size="sm" variant="solid" tone="primary">
            Upgrade
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="lg">
          <Stat label="Revenue" value="$48.2k" trend={{ value: 12, label: 'vs last mo' }} />
        </Card>
        <Card padding="lg">
          <Stat label="Active users" value="2,310" trend={{ value: 4, label: 'WoW' }} />
        </Card>
        <Card padding="lg">
          <Stat label="Churn" value="1.8%" trend={{ value: -2, label: 'improved' }} />
        </Card>
      </div>

      {/* Two-column: form card + tabs/table card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padding="lg" className="flex flex-col gap-4">
          <Card.Header className="p-0">
            <Card.Title>Buttons & inputs</Card.Title>
            <Card.Description>Every tone across solid, soft, and outline.</Card.Description>
          </Card.Header>

          <div className="flex flex-wrap gap-2">
            <Button tone="primary">Primary</Button>
            <Button tone="neutral">Neutral</Button>
            <Button tone="success">Success</Button>
            <Button tone="warning">Warning</Button>
            <Button tone="danger">Danger</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="soft" tone="primary">
              Soft
            </Button>
            <Button variant="outline" tone="primary">
              Outline
            </Button>
            <Button variant="ghost" tone="primary">
              Ghost
            </Button>
            <Button variant="link" tone="primary">
              Link
            </Button>
          </div>

          <TextInput placeholder="you@example.com" defaultValue="" />

          <Select<string> value={plan} onValueChange={(opt) => setPlan(opt?.itemKey ?? null)}>
            <Select.Trigger>
              <Select.Value placeholder="Choose a plan…" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item itemKey="free" label="Free" />
              <Select.Item itemKey="pro" label="Pro" />
              <Select.Item itemKey="team" label="Team" />
              <Select.Item itemKey="enterprise" label="Enterprise" />
            </Select.Content>
          </Select>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Brand</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Tag variant="brand">design</Tag>
            <Tag variant="neutral">ui</Tag>
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col gap-4">
          <Tabs defaultValue="invoices">
            <TabsList>
              <TabsTab value="invoices">Invoices</TabsTab>
              <TabsTab value="alerts">Alerts</TabsTab>
            </TabsList>

            <TabsPanel value="invoices" className="pt-4">
              <Table isHoverable className="w-full">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Invoice</TableHeaderCell>
                    <TableHeaderCell>Plan</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROWS.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.id}</TableCell>
                      <TableCell>{row.plan}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_TONE[row.status]} size="sm">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{row.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsPanel>

            <TabsPanel value="alerts" className="flex flex-col gap-3 pt-4">
              <Alert severity="success" title="Payment received" description="Your invoice was paid." />
              <Alert severity="warning" title="Card expiring" description="Update your card before the 30th." />
              <Alert severity="danger" title="Sync failed" description="We couldn't reach the billing provider." />
            </TabsPanel>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
