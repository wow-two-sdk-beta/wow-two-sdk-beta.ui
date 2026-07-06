import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Forms/Switch',
  component: Switch,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = { args: { 'aria-label': 'Toggle option' } };
export const Checked: Story = { args: { defaultChecked: true, 'aria-label': 'Toggle option' } };
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Switch key={s} size={s} defaultChecked aria-label={`Toggle option (${s})`} />
      ))}
    </div>
  ),
};
