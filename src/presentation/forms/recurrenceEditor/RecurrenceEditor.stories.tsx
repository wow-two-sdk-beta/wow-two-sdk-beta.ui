import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RecurrenceEditor, type RecurrenceRule } from './RecurrenceEditor';

const meta: Meta<typeof RecurrenceEditor> = {
  title: 'Forms/RecurrenceEditor',
  component: RecurrenceEditor,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecurrenceEditor>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [rule, setRule] = useState<RecurrenceRule>({
        freq: 'WEEKLY',
        interval: 1,
        byDay: ['MO', 'WE', 'FR'],
      });
      return (
        <div className="w-[28rem] space-y-3">
          <RecurrenceEditor value={rule} onValueChange={setRule} />
          <pre className="rounded-md bg-muted p-2 text-xs">{JSON.stringify(rule, null, 2)}</pre>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Monthly: Story = {
  render: () => (
    <div className="w-[28rem]">
      <RecurrenceEditor defaultValue={{ freq: 'MONTHLY', interval: 1, byMonthDay: 15 }} />
    </div>
  ),
};

export const WithCount: Story = {
  render: () => (
    <div className="w-[28rem]">
      <RecurrenceEditor defaultValue={{ freq: 'DAILY', interval: 1, count: 10 }} />
    </div>
  ),
};
