import type { Meta, StoryObj } from '@storybook/react';
import { Marquee } from './Marquee';

const meta: Meta<typeof Marquee> = {
  title: 'Display/Marquee',
  component: Marquee,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Marquee>;

const LOGOS = ['Acme', 'Vercel', 'Stripe', 'Linear', 'Notion', 'Figma', 'Supabase', 'Anthropic'];

export const Default: Story = {
  render: () => (
    <div className="w-[48rem]">
      <Marquee>
        {LOGOS.map((l) => (
          <span key={l} className="text-2xl font-bold text-muted-foreground">
            {l}
          </span>
        ))}
      </Marquee>
    </div>
  ),
};

export const Reverse: Story = {
  render: () => (
    <div className="w-[48rem] space-y-4">
      <Marquee>
        {LOGOS.map((l) => (
          <span key={l} className="text-2xl font-bold text-muted-foreground">
            {l}
          </span>
        ))}
      </Marquee>
      <Marquee direction="right" speed={40}>
        {LOGOS.map((l) => (
          <span key={l} className="text-2xl font-bold text-muted-foreground">
            {l}
          </span>
        ))}
      </Marquee>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="h-72 w-72">
      <Marquee direction="up" speed={20}>
        {LOGOS.map((l) => (
          <span key={l} className="text-xl font-bold text-muted-foreground">
            {l}
          </span>
        ))}
      </Marquee>
    </div>
  ),
};
