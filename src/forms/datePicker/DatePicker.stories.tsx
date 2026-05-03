import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DatePicker>;

function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <div className="w-72">
      <DatePicker value={date} onChange={setDate} />
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const WithDefault: Story = {
  render: () => (
    <div className="w-72">
      <DatePicker defaultValue={new Date()} />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <DatePicker invalid placeholder="Required" />
    </div>
  ),
};
