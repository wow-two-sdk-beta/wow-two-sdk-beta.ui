import type { Meta, StoryObj } from '@storybook/react';
import { PricingCard } from './PricingCard';

const meta: Meta<typeof PricingCard> = {
  title: 'Display/PricingCard',
  component: PricingCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[18rem] pt-4"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PricingCard>;

/** Generic CTA slot — consumers pass their own `<Button asChild><Link/></Button>`. */
const SolidCta = ({ children }: { children: string }) => (
  <button className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
    {children}
  </button>
);
const OutlineCta = ({ children }: { children: string }) => (
  <button className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground">
    {children}
  </button>
);

export const Default: Story = {
  args: {
    name: 'Free',
    price: '$0',
    cadence: '/forever',
    tagline: 'Everything to get your first code live.',
    features: ['Unlimited scans', 'Never expires', '1 active code'],
    children: <OutlineCta>Get started</OutlineCta>,
  },
};

export const Featured: Story = {
  args: {
    name: 'Pro',
    price: '$9',
    cadence: '/mo',
    tagline: 'For people who ship a lot of codes.',
    features: ['Everything in Free', 'Unlimited codes', 'Context routing', 'Analytics'],
    featured: true,
    children: <SolidCta>Start Pro</SolidCta>,
  },
};

export const CustomBadge: Story = {
  args: {
    name: 'Team',
    price: '$29',
    cadence: '/mo',
    tagline: 'Shared codes for the whole org.',
    features: ['Everything in Pro', 'Seats & roles', 'Priority support'],
    featured: true,
    badgeLabel: 'Best value',
    children: <SolidCta>Start Team</SolidCta>,
  },
};
