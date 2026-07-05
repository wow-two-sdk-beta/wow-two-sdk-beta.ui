import type { Meta, StoryObj } from '@storybook/react';
import { Section } from './Section';

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Section>;

export const Plain: Story = {
  args: {
    py: 'md',
    children: (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Section heading</h2>
        <p className="text-muted-foreground">
          A transparent band — width-constrained content, no background tint.
        </p>
      </div>
    ),
  },
};

export const Tinted: Story = {
  args: {
    tone: 'primary',
    py: 'lg',
    children: (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Primary band</h2>
        <p className="text-muted-foreground">
          Shadow-less `subtle` tint (low-alpha fill + border) — the marketing band look.
        </p>
      </div>
    ),
  },
};

export const Stacked: Story = {
  render: () => (
    <div>
      <Section tone="neutral" py="lg">
        <h2 className="text-2xl font-semibold">Muted band</h2>
        <p className="text-muted-foreground">tone=&quot;neutral&quot;</p>
      </Section>
      <Section py="lg">
        <h2 className="text-2xl font-semibold">Plain band</h2>
        <p className="text-muted-foreground">no tone</p>
      </Section>
      <Section tone="primary" py="lg" containerSize="md">
        <h2 className="text-2xl font-semibold">Primary band, narrow container</h2>
        <p className="text-muted-foreground">tone=&quot;primary&quot;, containerSize=&quot;md&quot;</p>
      </Section>
    </div>
  ),
};
