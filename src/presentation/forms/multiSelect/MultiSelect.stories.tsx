import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MultiSelect } from './MultiSelect';

const meta: Meta<typeof MultiSelect> = {
  title: 'Forms/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MultiSelect>;

function DefaultDemo() {
  const [values, setValues] = useState<string[]>([]);
  return (
    <div className="w-80">
      <MultiSelect value={values} onValueChange={setValues}>
        <MultiSelect.Trigger>
          <MultiSelect.Tags placeholder="Pick fruits..." />
        </MultiSelect.Trigger>
        <MultiSelect.Content>
          <MultiSelect.Item value="apple">Apple</MultiSelect.Item>
          <MultiSelect.Item value="banana">Banana</MultiSelect.Item>
          <MultiSelect.Item value="cherry">Cherry</MultiSelect.Item>
          <MultiSelect.Item value="durian">Durian</MultiSelect.Item>
          <MultiSelect.Item value="elderberry">Elderberry</MultiSelect.Item>
        </MultiSelect.Content>
      </MultiSelect>
    </div>
  );
}

function PreSelectedDemo() {
  const [values, setValues] = useState<string[]>(['apple', 'cherry']);
  return (
    <div className="w-80">
      <MultiSelect value={values} onValueChange={setValues}>
        <MultiSelect.Trigger>
          <MultiSelect.Tags placeholder="Pick fruits..." />
        </MultiSelect.Trigger>
        <MultiSelect.Content>
          <MultiSelect.Item value="apple">Apple</MultiSelect.Item>
          <MultiSelect.Item value="banana">Banana</MultiSelect.Item>
          <MultiSelect.Item value="cherry">Cherry</MultiSelect.Item>
        </MultiSelect.Content>
      </MultiSelect>
    </div>
  );
}

export const Default: Story = { render: () => <DefaultDemo /> };
export const PreSelected: Story = { render: () => <PreSelectedDemo /> };
