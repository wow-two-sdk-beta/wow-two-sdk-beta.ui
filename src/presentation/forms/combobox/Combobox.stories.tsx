import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Combobox } from './Combobox';

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
];

const meta: Meta<typeof Combobox> = {
  title: 'Forms/Combobox',
  component: Combobox,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Combobox>;

function DefaultDemo() {
  const [value, setValue] = useState('');
  const [input, setInput] = useState('');
  const matches = useMemo(
    () => FRUITS.filter((f) => f.label.toLowerCase().includes(input.toLowerCase())),
    [input],
  );
  return (
    <div className="w-72">
      <Combobox
        value={value}
        onValueChange={setValue}
        inputValue={input}
        onInputChange={setInput}
      >
        <Combobox.Input placeholder="Search fruit..." />
        <Combobox.Content>
          {matches.length === 0 ? (
            <Combobox.Empty>No matches</Combobox.Empty>
          ) : (
            matches.map((f) => (
              <Combobox.Item key={f.value} value={f.value}>
                {f.label}
              </Combobox.Item>
            ))
          )}
        </Combobox.Content>
      </Combobox>
    </div>
  );
}

function GroupedDemo() {
  const [value, setValue] = useState('');
  const [input, setInput] = useState('');
  return (
    <div className="w-72">
      <Combobox
        value={value}
        onValueChange={setValue}
        inputValue={input}
        onInputChange={setInput}
      >
        <Combobox.Input placeholder="Search..." />
        <Combobox.Content>
          <Combobox.Group label="Fruits">
            <Combobox.Item value="apple">Apple</Combobox.Item>
            <Combobox.Item value="banana">Banana</Combobox.Item>
          </Combobox.Group>
          <Combobox.Separator />
          <Combobox.Group label="Vegetables">
            <Combobox.Item value="carrot">Carrot</Combobox.Item>
            <Combobox.Item value="broccoli">Broccoli</Combobox.Item>
          </Combobox.Group>
        </Combobox.Content>
      </Combobox>
    </div>
  );
}

export const Default: Story = { render: () => <DefaultDemo /> };
export const Grouped: Story = { render: () => <GroupedDemo /> };
