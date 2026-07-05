import type { Meta, StoryObj } from '@storybook/react';
import { Snippet } from './Snippet';

const meta: Meta<typeof Snippet> = {
  title: 'Display/Snippet',
  component: Snippet,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Snippet>;

export const Inline: Story = {
  args: { text: 'pnpm add @wow-two-beta/ui', className: 'w-80' },
};

export const Block: Story = {
  args: {
    text: `import { Button } from '@wow-two-beta/ui';\n\n<Button>Click me</Button>`,
    variant: 'block',
    className: 'w-96',
  },
};
