import type { Meta, StoryObj } from '@storybook/react';
import { SwitchField } from './SwitchField';

const meta: Meta<typeof SwitchField> = {
  title: 'Forms/SwitchField',
  component: SwitchField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SwitchField>;

export const Right: Story = {
  args: { label: 'Email notifications', description: 'Send updates to your inbox.', side: 'right' },
  render: (args) => <div className="w-80"><SwitchField {...args} /></div>,
};
