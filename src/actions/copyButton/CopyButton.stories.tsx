import type { Meta, StoryObj } from '@storybook/react';
import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  title: 'Actions/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CopyButton>;

export const IconOnly: Story = { args: { text: 'hello world' } };

export const WithLabel: Story = {
  args: {
    text: 'hello world',
    variant: 'secondary',
    children: ({ copied }: { copied: boolean }) => (copied ? 'Copied!' : 'Copy'),
  },
};
