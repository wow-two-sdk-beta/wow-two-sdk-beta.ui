import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TimePicker } from './TimePicker';
import type { TimeValue } from '../timeField';

const meta: Meta<typeof TimePicker> = {
  title: 'Forms/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TimePicker>;

function Demo() {
  const [time, setTime] = useState<TimeValue | null>(null);
  return (
    <div className="w-72">
      <TimePicker value={time} onChange={setTime} />
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const FifteenMinuteSteps: Story = {
  render: () => (
    <div className="w-72">
      <TimePicker minuteStep={15} defaultValue={{ hours: 9, minutes: 0 }} />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <TimePicker invalid placeholder="Required" />
    </div>
  ),
};
