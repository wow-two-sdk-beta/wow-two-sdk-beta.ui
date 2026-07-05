import type { Meta, StoryObj } from '@storybook/react';
import { Globe, Smartphone } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

const meta: Meta<typeof FeatureCard> = {
  title: 'Display/FeatureCard',
  component: FeatureCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[20rem]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof FeatureCard>;

export const Default: Story = {
  args: {
    icon: <Smartphone size={22} />,
    title: 'Context-aware routing',
    description: 'Send one printed code to different destinations by device, country, or time of day.',
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'Never expires',
    description: 'Your codes keep resolving forever — change the target without reprinting.',
  },
};

export const ChildrenBody: Story = {
  args: {
    icon: <Globe size={22} />,
    title: 'Works everywhere',
    children: 'Any scanner, any phone — no app required to open a code.',
  },
};
