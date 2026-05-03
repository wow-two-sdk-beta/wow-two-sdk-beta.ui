import type { Meta, StoryObj } from '@storybook/react';
import { KeyboardShortcut } from './KeyboardShortcut';

const meta: Meta<typeof KeyboardShortcut> = {
  title: 'Display/KeyboardShortcut',
  component: KeyboardShortcut,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof KeyboardShortcut>;

export const CommandK: Story = { args: { keys: ['⌘', 'K'] } };
export const Triple: Story = { args: { keys: ['Ctrl', 'Shift', 'P'] } };
