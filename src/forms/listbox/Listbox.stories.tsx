import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Listbox } from './Listbox';

const meta: Meta<typeof Listbox> = {
  title: 'Forms/Listbox',
  component: Listbox,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Listbox>;

function SingleDemo() {
  const [value, setValue] = useState('apple');
  return (
    <div className="w-64">
      <Listbox value={value} onValueChange={setValue} aria-label="Choose fruit">
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="banana">Banana</Listbox.Item>
        <Listbox.Item value="cherry" disabled>
          Cherry (disabled)
        </Listbox.Item>
        <Listbox.Item value="durian">Durian</Listbox.Item>
      </Listbox>
    </div>
  );
}

function MultiDemo() {
  const [values, setValues] = useState<string[]>(['apple', 'cherry']);
  return (
    <div className="w-64">
      <Listbox multiple value={values} onValueChange={setValues} aria-label="Choose fruits">
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="banana">Banana</Listbox.Item>
        <Listbox.Item value="cherry">Cherry</Listbox.Item>
        <Listbox.Item value="durian">Durian</Listbox.Item>
      </Listbox>
    </div>
  );
}

export const Default: Story = { render: () => <SingleDemo /> };
export const Multiple: Story = { render: () => <MultiDemo /> };

export const Grouped: Story = {
  render: () => (
    <div className="w-64">
      <Listbox aria-label="Choose food">
        <Listbox.Group label="Fruits">
          <Listbox.Item value="apple">Apple</Listbox.Item>
          <Listbox.Item value="banana">Banana</Listbox.Item>
        </Listbox.Group>
        <Listbox.Separator />
        <Listbox.Group label="Vegetables">
          <Listbox.Item value="carrot">Carrot</Listbox.Item>
          <Listbox.Item value="broccoli">Broccoli</Listbox.Item>
        </Listbox.Group>
      </Listbox>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-64">
      <Listbox aria-label="No items">
        <Listbox.Empty>No options found</Listbox.Empty>
      </Listbox>
    </div>
  ),
};
