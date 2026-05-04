import type { Meta, StoryObj } from '@storybook/react';
import { CountUp } from './CountUp';

const meta: Meta<typeof CountUp> = {
  title: 'Display/CountUp',
  component: CountUp,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CountUp>;

export const Default: Story = {
  render: () => (
    <CountUp to={1234} as="div" className="text-4xl font-bold" />
  ),
};

export const Currency: Story = {
  render: () => (
    <CountUp
      to={49995}
      duration={2000}
      format={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
      as="div"
      className="text-4xl font-bold"
    />
  ),
};

export const Decimal: Story = {
  render: () => (
    <CountUp to={87.5} format={(v) => v.toFixed(1) + '%'} as="div" className="text-4xl font-bold text-success" />
  ),
};

export const TriggerOnView: Story = {
  render: () => (
    <div>
      <p className="mb-[60vh] text-sm text-muted-foreground">Scroll down to trigger…</p>
      <CountUp to={9999} triggerOnView as="div" className="text-5xl font-bold text-primary" />
    </div>
  ),
};
