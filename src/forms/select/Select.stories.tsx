import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Select>;

function DefaultDemo() {
  const [value, setValue] = useState('');
  return (
    <div className="w-72">
      <Select value={value} onValueChange={setValue}>
        <Select.Trigger>
          <Select.Value placeholder="Choose a fruit..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
          <Select.Item value="cherry">Cherry</Select.Item>
          <Select.Item value="durian">Durian</Select.Item>
        </Select.Content>
      </Select>
    </div>
  );
}

function GroupedDemo() {
  const [value, setValue] = useState('apple');
  return (
    <div className="w-72">
      <Select value={value} onValueChange={setValue}>
        <Select.Trigger>
          <Select.Value placeholder="Pick food..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Group label="Fruits">
            <Select.Item value="apple">Apple</Select.Item>
            <Select.Item value="banana">Banana</Select.Item>
          </Select.Group>
          <Select.Separator />
          <Select.Group label="Vegetables">
            <Select.Item value="carrot">Carrot</Select.Item>
            <Select.Item value="broccoli">Broccoli</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select>
    </div>
  );
}

export const Default: Story = { render: () => <DefaultDemo /> };
export const Grouped: Story = { render: () => <GroupedDemo /> };

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <Select invalid>
        <Select.Trigger>
          <Select.Value placeholder="Required field" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">Option A</Select.Item>
          <Select.Item value="b">Option B</Select.Item>
        </Select.Content>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <Select disabled defaultValue="apple">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
        </Select.Content>
      </Select>
    </div>
  ),
};
