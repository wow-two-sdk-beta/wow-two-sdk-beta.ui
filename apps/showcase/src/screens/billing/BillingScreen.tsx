import { useMemo, useState } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import {
  Badge,
  Card,
  DescriptionList,
  InfoRow,
  SectionHeader,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@wow-two-beta/ui/display';
import { toaster } from '@wow-two-beta/ui/feedback';
import {
  AddressForm,
  ChoiceCard,
  CurrencyInput,
  DatePicker,
  Fieldset,
  FormErrorMessage,
  FormField,
  Legend,
  MaskedInput,
  NumberInput,
  PercentInput,
  RadioGroup,
  TelInput,
  type Address,
} from '@wow-two-beta/ui/forms';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@wow-two-beta/ui/overlays';
import { orders } from '../../fixtures';

/* ------------------------------------------------------------------ */
/* Deterministic page data                                             */
/* ------------------------------------------------------------------ */

interface Plan {
  id: string;
  name: string;
  priceUsd: number;
  description: string;
}

const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', priceUsd: 29, description: '5 projects · community support' },
  { id: 'pro', name: 'Pro', priceUsd: 79, description: 'Unlimited projects · priority support' },
  { id: 'scale', name: 'Scale', priceUsd: 199, description: 'SSO · audit logs · 99.9% SLA' },
];

/* First pending invoice from the shared fixtures — stable across renders. */
const invoice = orders.find((o) => o.status === 'pending');

const DEFAULT_ADDRESS: Address = {
  country: 'US',
  line1: '2261 Market St',
  line2: 'Suite 410',
  city: 'San Francisco',
  region: 'CA',
  postalCode: '94114',
};

/* Fixed literal — no clock reads. */
const DEFAULT_BILLING_DATE = new Date(2026, 6, 1);

const usd = (n: number) => `$${n.toFixed(2)}`;

const dateLabel = (d: Date | null) =>
  d
    ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function BillingScreen() {
  /* Plan + usage */
  const [planId, setPlanId] = useState<string | null>('pro');
  const [seats, setSeats] = useState(4);

  /* Payment form */
  const [cardNumber, setCardNumber] = useState('');
  const [cardTouched, setCardTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [creditUsd, setCreditUsd] = useState(25);
  const [taxRate, setTaxRate] = useState(8.5);
  const [billingDate, setBillingDate] = useState<Date | null>(DEFAULT_BILLING_DATE);
  const [address, setAddress] = useState<Address>(DEFAULT_ADDRESS);

  /* Flow */
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];

  const totals = useMemo(() => {
    const lineItems = invoice?.items ?? [];
    const invoiceSubtotal = lineItems.reduce((sum, it) => sum + it.qty * it.unitUsd, 0);
    const planSubtotal = (plan?.priceUsd ?? 0) * seats;
    const subtotal = invoiceSubtotal + planSubtotal;
    const tax = (subtotal * taxRate) / 100;
    const credit = Math.min(Math.max(creditUsd, 0), subtotal + tax);
    const due = Math.max(0, subtotal + tax - credit);
    return { invoiceSubtotal, planSubtotal, subtotal, tax, credit, due };
  }, [plan, seats, taxRate, creditUsd]);

  /* Validation */
  const cardDigits = cardNumber.replace(/\D/g, '');
  const cardError =
    (cardTouched || submitAttempted) && cardDigits.length !== 16
      ? 'Enter the full 16-digit card number.'
      : undefined;
  const phoneError =
    submitAttempted && phone.replace(/\D/g, '').length < 7
      ? 'A billing phone number is required.'
      : undefined;
  const hasErrors = cardDigits.length !== 16 || phone.replace(/\D/g, '').length < 7;

  if (!invoice) {
    return <div className="p-8 text-sm text-muted-foreground">No pending invoice in fixtures.</div>;
  }

  const handleReview = () => {
    setSubmitAttempted(true);
    setCardTouched(true);
    if (!hasErrors) setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setPaid(true);
    setConfirmOpen(false);
    toaster.toast({
      title: 'Payment received',
      description: `${invoice.id} settled — ${usd(totals.due)} charged to card •••• ${cardDigits.slice(-4)}.`,
      severity: 'success',
    });
  };

  const summaryItems = [
    { label: 'Invoice', value: invoice.id },
    { label: 'Customer', value: invoice.customer },
    { label: 'Plan', value: `${plan?.name ?? '—'} × ${seats} seat${seats === 1 ? '' : 's'}` },
    { label: 'Billing date', value: dateLabel(billingDate) },
    { label: 'Card', value: cardDigits.length === 16 ? `•••• ${cardDigits.slice(-4)}` : '—' },
    { label: 'Phone', value: phone || '—' },
    {
      label: 'Address',
      value: `${address.line1}, ${address.city} ${address.region} ${address.postalCode}, ${address.country}`,
    },
    { label: 'Subtotal', value: usd(totals.subtotal) },
    { label: `Tax (${taxRate}%)`, value: usd(totals.tax) },
    { label: 'Account credit', value: `−${usd(totals.credit)}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-5">
        {/* ---------------- Left column: plan + invoice ---------------- */}
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-3">
          {/* Plan picker */}
          <Card>
            <Card.Header>
              <Card.Title>Plan</Card.Title>
              <Card.Description>Applies to the upcoming billing cycle.</Card.Description>
            </Card.Header>
            <Card.Body>
              <RadioGroup
                value={planId}
                onValueChange={setPlanId}
                orientation="horizontal"
                disabled={paid}
                aria-label="Subscription plan"
              >
                {PLANS.map((p) => (
                  <ChoiceCard
                    key={p.id}
                    value={p.id}
                    label={`${p.name} — ${usd(p.priceUsd)}/seat`}
                    description={p.description}
                    className="min-w-52 flex-1"
                  />
                ))}
              </RadioGroup>
            </Card.Body>
          </Card>

          {/* Invoice */}
          <Card>
            <Card.Header className="pb-0">
              <SectionHeader
                title={`Invoice ${invoice.id}`}
                description={`${invoice.customer} · ${invoice.customerEmail}`}
                size="md"
                bordered={false}
                actions={
                  paid ? (
                    <Badge variant="success">paid</Badge>
                  ) : (
                    <Badge variant="warning">{invoice.status}</Badge>
                  )
                }
              />
            </Card.Header>
            <Card.Body className="flex flex-col gap-4">
              <Table density="cozy" hoverable>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>SKU</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell className="text-right">Qty</TableHeaderCell>
                    <TableHeaderCell className="text-right">Unit</TableHeaderCell>
                    <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.sku}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right">{usd(item.unitUsd)}</TableCell>
                      <TableCell className="text-right">{usd(item.qty * item.unitUsd)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-mono text-xs">PLAN-{plan?.id.toUpperCase() ?? '—'}</TableCell>
                    <TableCell>
                      {plan?.name ?? '—'} plan · {seats} seat{seats === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell className="text-right">{seats}</TableCell>
                    <TableCell className="text-right">{usd(plan?.priceUsd ?? 0)}</TableCell>
                    <TableCell className="text-right">{usd(totals.planSubtotal)}</TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-medium">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {usd(totals.subtotal)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-3">
                <Stat size="sm" label="Subtotal" value={usd(totals.subtotal)} helper="Line items + plan" />
                <Stat size="sm" label={`Tax (${taxRate}%)`} value={usd(totals.tax)} helper={`Credit −${usd(totals.credit)}`} />
                <Stat
                  size="sm"
                  label="Total due"
                  value={usd(totals.due)}
                  helper={paid ? 'Settled' : `Charges on ${dateLabel(billingDate)}`}
                />
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* ---------------- Right column: payment form ---------------- */}
        <Card className="self-start xl:col-span-2">
          <Card.Header>
            <Card.Title>Payment details</Card.Title>
            <Card.Description>Charged once you confirm the summary.</Card.Description>
          </Card.Header>
          <Card.Body className="flex flex-col gap-4">
            <Fieldset className="flex flex-col gap-4" disabled={paid}>
              <Legend>Payment method</Legend>

              <FormField
                label="Card number"
                helper="Digits only — spacing is applied automatically."
                error={cardError}
                isRequired
              >
                <MaskedInput
                  mask="#### #### #### ####"
                  value={cardNumber}
                  onValueChange={setCardNumber}
                  onBlur={() => setCardTouched(true)}
                  placeholder="4242 4242 4242 4242"
                  autoComplete="cc-number"
                />
              </FormField>

              <FormField label="Billing phone" error={phoneError} isRequired>
                <TelInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 415 555 0134"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Seats" helper="1–50">
                  <NumberInput
                    min={1}
                    max={50}
                    value={seats}
                    onChange={(e) => {
                      const next = Math.trunc(Number(e.target.value));
                      setSeats(Number.isFinite(next) ? Math.min(50, Math.max(1, next)) : 1);
                    }}
                  />
                </FormField>
                <FormField label="Account credit" helper="Applied to total">
                  <CurrencyInput
                    min={0}
                    step={5}
                    value={creditUsd}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setCreditUsd(Number.isFinite(next) ? Math.max(0, next) : 0);
                    }}
                  />
                </FormField>
                <FormField label="Tax rate" helper="Region default">
                  <PercentInput
                    min={0}
                    max={30}
                    step={0.5}
                    value={taxRate}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setTaxRate(Number.isFinite(next) ? Math.min(30, Math.max(0, next)) : 0);
                    }}
                  />
                </FormField>
              </div>

              <FormField label="Billing date" helper="First charge of the new cycle.">
                <DatePicker
                  value={billingDate}
                  onValueChange={setBillingDate}
                  min={new Date(2026, 5, 1)}
                  max={new Date(2026, 11, 31)}
                  placeholder="Pick a billing date"
                />
              </FormField>
            </Fieldset>

            <Fieldset className="flex flex-col gap-3" disabled={paid}>
              <Legend>Billing address</Legend>
              <AddressForm value={address} onValueChange={setAddress} disabled={paid} />
            </Fieldset>

            {submitAttempted && hasErrors && !paid && (
              <FormErrorMessage>Fix the highlighted fields before reviewing the payment.</FormErrorMessage>
            )}
          </Card.Body>
          <Card.Footer className="justify-end">
            {paid ? (
              <InfoRow
                label="Receipt"
                value={`${invoice.id} · ${usd(totals.due)} paid`}
                className="w-full"
              />
            ) : (
              <Button variant="solid" tone="primary" onClick={handleReview}>
                Review &amp; pay {usd(totals.due)}
              </Button>
            )}
          </Card.Footer>
        </Card>
      </div>

      {/* ---------------- Confirm dialog (mounts only via button) ---------------- */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm payment</DialogTitle>
            <DialogDescription>
              Review the charge before it is submitted — this is a one-time payment.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <DescriptionList items={summaryItems} layout="inline" density="sm" />
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
              <InfoRow
                label="Total due"
                value={<span className="text-base font-semibold text-foreground">{usd(totals.due)}</span>}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" tone="neutral">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="solid" tone="primary" onClick={handleConfirm}>
              Pay {usd(totals.due)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
