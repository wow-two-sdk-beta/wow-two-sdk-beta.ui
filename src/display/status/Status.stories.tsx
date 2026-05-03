import type { Meta, StoryObj } from '@storybook/react';
import { Status } from './Status';

const meta: Meta<typeof Status> = {
  title: 'Display/Status',
  component: Status,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Status>;

export const Online: Story = { args: { tone: 'success', children: 'Online', pulse: true } };
export const Degraded: Story = { args: { tone: 'warning', children: 'Degraded' } };
export const Down: Story = { args: { tone: 'destructive', children: 'Down' } };
