import type { Meta, StoryObj } from '@storybook/react';
import { Bold } from 'lucide-react';
import { Icon } from '../../icons';
import { ToggleButton } from './ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: 'Actions/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ToggleButton>;

export const Default: Story = { args: { children: 'Toggle' } };
export const DefaultPressed: Story = { args: { defaultPressed: true, children: 'Pressed' } };
export const WithIcon: Story = {
  args: { 'aria-label': 'Bold', children: <Icon icon={Bold} size={16} /> },
};
