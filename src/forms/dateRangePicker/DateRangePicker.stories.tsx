import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from '../rangeCalendar';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Forms/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DateRangePicker>;

function Demo() {
  const [range, setRange] = useState<DateRange | null>(null);
  return (
    <div className="w-96">
      <DateRangePicker value={range} onChange={setRange} />
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const Invalid: Story = {
  render: () => (
    <div className="w-96">
      <DateRangePicker invalid placeholder="Required range" />
    </div>
  ),
};
