import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RangeCalendar, type DateRange } from './RangeCalendar';

const meta: Meta<typeof RangeCalendar> = {
  title: 'Forms/RangeCalendar',
  component: RangeCalendar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RangeCalendar>;

function Demo() {
  const [range, setRange] = useState<DateRange | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <RangeCalendar value={range} onChange={setRange} />
      <p className="text-sm text-muted-foreground">
        Range:{' '}
        {range?.start ? range.start.toDateString() : '—'}
        {' → '}
        {range?.end ? range.end.toDateString() : '—'}
      </p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };
