import type { Meta, StoryObj } from '@storybook/react';
import { GradientText } from './GradientText';

const meta: Meta<typeof GradientText> = {
  title: 'Display/GradientText',
  component: GradientText,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof GradientText>;

export const Default: Story = {
  render: () => <GradientText as="h1" className="text-4xl font-bold">Build the future</GradientText>,
};

export const Animated: Story = {
  render: () => (
    <GradientText
      as="h2"
      animated
      from="oklch(0.65 0.25 280)"
      via="oklch(0.7 0.2 200)"
      to="oklch(0.75 0.2 140)"
      className="text-3xl font-bold"
    >
      Animated gradient
    </GradientText>
  ),
};

export const Diagonal: Story = {
  render: () => (
    <GradientText as="span" direction="br" from="#06b6d4" to="#a855f7" className="text-2xl font-semibold">
      Diagonal sweep
    </GradientText>
  ),
};
