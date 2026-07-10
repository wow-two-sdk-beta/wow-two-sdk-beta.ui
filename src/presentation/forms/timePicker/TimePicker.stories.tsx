import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from 'temporal-polyfill';
import { TimePicker } from './TimePicker';

const meta: Meta<typeof TimePicker> = {
  title: 'Forms/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TimePicker>;

function Demo() {
  const [time, setTime] = useState<Temporal.PlainTime | null>(null);
  return (
    <div className="w-72">
      <TimePicker value={time} onValueChange={setTime} />
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const FifteenMinuteSteps: Story = {
  render: () => (
    <div className="w-72">
      <TimePicker minuteStep={15} defaultValue={Temporal.PlainTime.from('09:00')} />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <TimePicker isInvalid placeholder="Required" />
    </div>
  ),
};
