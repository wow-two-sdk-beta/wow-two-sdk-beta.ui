import type { Meta, StoryObj } from '@storybook/react';
import { Tilt } from './Tilt';

const meta: Meta<typeof Tilt> = {
  title: 'Display/Tilt',
  component: Tilt,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Tilt>;

export const Default: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-12">
      {['Pro', 'Team', 'Enterprise'].map((label, i) => (
        <Tilt key={label} className="cursor-pointer">
          <div className="rounded-xl bg-gradient-to-br from-primary-soft to-info-soft p-8 shadow-lg ring-1 ring-border">
            <div className="text-sm text-muted-foreground">Plan</div>
            <h3 className="text-2xl font-bold">{label}</h3>
            <div className="mt-4 text-3xl font-bold tabular-nums">${(i + 1) * 19}</div>
            <div className="text-xs text-muted-foreground">/ month</div>
          </div>
        </Tilt>
      ))}
    </div>
  ),
};

export const WithGlare: Story = {
  render: () => (
    <div className="p-12">
      <Tilt glare scale={1.05} className="cursor-pointer">
        <div className="rounded-xl bg-gradient-to-br from-primary to-info p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold">Hover me</h2>
          <p className="mt-2 text-sm opacity-80">Tilt with glare highlight following the cursor.</p>
        </div>
      </Tilt>
    </div>
  ),
};
