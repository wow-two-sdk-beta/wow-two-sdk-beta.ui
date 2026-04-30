import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'Forms/Radio',
  component: Radio,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = { args: { name: 'pick' } };
export const Group: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <Radio name="g" defaultChecked /> One
      </label>
      <label className="flex items-center gap-2">
        <Radio name="g" /> Two
      </label>
      <label className="flex items-center gap-2">
        <Radio name="g" /> Three
      </label>
    </div>
  ),
};
