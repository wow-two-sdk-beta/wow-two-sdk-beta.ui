import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './Heading';

const meta: Meta<typeof Heading> = {
  title: 'Display/Heading',
  component: Heading,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = { args: { children: 'The quick brown fox' } };
export const Sizes: Story = {
  render: () => (
    <div className="space-y-2">
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const).map((s) => (
        <Heading key={s} size={s}>{`Size ${s}`}</Heading>
      ))}
    </div>
  ),
};
