import type { Meta, StoryObj } from '@storybook/react';
import { Frame } from './Frame';

const meta: Meta<typeof Frame> = {
  title: 'Layout/Frame',
  component: Frame,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Frame>;

export const Card: Story = { args: { children: 'Free-form content', className: 'w-80' } };
export const Muted: Story = {
  args: { surface: 'muted', bordered: false, children: 'Recessed surface', className: 'w-80' },
};
