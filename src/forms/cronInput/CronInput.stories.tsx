import type { Meta, StoryObj } from '@storybook/react';
import { CronInput } from './CronInput';

const meta: Meta<typeof CronInput> = {
  title: 'Forms/CronInput',
  component: CronInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CronInput>;

export const Default: Story = {
  render: () => (
    <div className="w-[26rem] space-y-3">
      <CronInput defaultValue="*/5 * * * *" />
      <CronInput defaultValue="0 9 * * 1,3,5" />
      <CronInput defaultValue="0 0 1 * *" />
      <CronInput defaultValue="*/15 * * * *" />
      <CronInput defaultValue="invalid" />
    </div>
  ),
};
