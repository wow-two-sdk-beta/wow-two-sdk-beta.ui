import type { Meta, StoryObj } from '@storybook/react';
import { Inline } from './Inline';

const meta: Meta<typeof Inline> = {
  title: 'Layout/Inline',
  component: Inline,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Inline>;

export const Tags: Story = {
  render: () => (
    <Inline className="w-72">
      {['react', 'tailwind', 'tsup', 'vite', 'storybook'].map((t) => (
        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
      ))}
    </Inline>
  ),
};
