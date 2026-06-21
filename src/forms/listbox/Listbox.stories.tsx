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
  const [value, setValue] = useState<string | undefined>('apple');
  return (
    <div className="w-64">
      <Listbox value={value} onValueChange={setValue} aria-label="Choose fruit">
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="banana">Banana</Listbox.Item>
        <Listbox.Item value="cherry" isDisabled>
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
      <Listbox isMultiple value={values} onValueChange={setValues} aria-label="Choose fruits">
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="banana">Banana</Listbox.Item>
        <Listbox.Item value="cherry">Cherry</Listbox.Item>
        <Listbox.Item value="durian">Durian</Listbox.Item>
      </Listbox>
    </div>
  );
}

interface Item {
  id: number;
  label: string;
}

function GenericDemo() {
  const items: Item[] = [
    { id: 1, label: 'One' },
    { id: 2, label: 'Two' },
    { id: 3, label: 'Three' },
  ];
  const [picked, setPicked] = useState<Item | undefined>(items[0]);
  return (
    <div className="w-64">
      <Listbox<Item>
        value={picked}
        onValueChange={setPicked}
        isEqual={(a, b) => a.id === b.id}
        aria-label="Pick an object"
      >
        {items.map((it) => (
          <Listbox.Item key={it.id} value={it}>
            {it.label}
          </Listbox.Item>
        ))}
      </Listbox>
    </div>
  );
}

function TypeaheadDemo() {
  /* Focus the list and type. Prefix-match: "ch" jumps to Cherry. Same-letter repeat cycles:
     pressing "b" repeatedly walks Banana → Blackberry → Blueberry. Disabled items are skipped;
     the buffer resets after ~500ms idle. */
  const fruits = [
    'Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry',
    'Cherry', 'Coconut', 'Cranberry', 'Date', 'Durian', 'Fig', 'Grape',
  ];
  const [value, setValue] = useState<string | undefined>('Apple');
  return (
    <div className="flex w-64 flex-col gap-2">
      <p className="text-xs text-subtle-foreground">
        Click the list, then type — e.g. “ch” → Cherry, or tap “b” repeatedly to cycle B-fruits.
      </p>
      <Listbox value={value} onValueChange={setValue} aria-label="Type to select a fruit">
        {fruits.map((f) => (
          <Listbox.Item key={f} value={f} isDisabled={f === 'Date'}>
            {f}
            {f === 'Date' ? ' (disabled)' : ''}
          </Listbox.Item>
        ))}
      </Listbox>
      <p className="text-xs text-subtle-foreground">Selected: {value ?? '—'}</p>
    </div>
  );
}

export const Default: Story = { render: () => <SingleDemo /> };
export const Multiple: Story = { render: () => <MultiDemo /> };
export const GenericObject: Story = { render: () => <GenericDemo /> };
export const Typeahead: Story = { render: () => <TypeaheadDemo /> };

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
