import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
  title: 'Display/Text',
  component: Text,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = { args: { children: 'Body text — the quick brown fox.' } };
export const Muted: Story = { args: { color: 'muted', children: 'Subtle copy.' } };
export const Truncated: Story = {
  render: () => (
    <Text truncate className="w-48">
      Long text that overflows and should be truncated with ellipsis.
    </Text>
  ),
};
