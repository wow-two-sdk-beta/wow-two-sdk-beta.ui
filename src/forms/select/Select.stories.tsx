import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';
import { Listbox } from '../listbox';

const meta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Select>;

function DefaultDemo() {
  const [value, setValue] = useState<string | null>(null);
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
  const [value, setValue] = useState<string | null>('apple');
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

function SearchableDemo() {
  const [value, setValue] = useState<string | null>(null);
  const fruits = [
    'Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cherry',
    'Coconut', 'Cranberry', 'Date', 'Durian', 'Elderberry', 'Fig',
    'Grape', 'Grapefruit', 'Guava', 'Kiwi', 'Lemon', 'Lime', 'Mango',
    'Melon', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pineapple', 'Plum',
    'Raspberry', 'Strawberry', 'Tangerine', 'Watermelon',
  ];
  return (
    <div className="w-72">
      <Select value={value} onValueChange={setValue} clearable>
        <Select.Trigger>
          <Select.Value placeholder="Search a fruit..." />
        </Select.Trigger>
        <Select.Content searchable searchPlaceholder="Type to filter…">
          {fruits.map((f) => (
            <Select.Item key={f} value={f.toLowerCase()}>{f}</Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}

function ClearableDemo() {
  const [value, setValue] = useState<string | null>('apple');
  return (
    <div className="w-72">
      <Select value={value} onValueChange={setValue} clearable>
        <Select.Trigger>
          <Select.Value placeholder="Pick one..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
          <Select.Item value="cherry">Cherry</Select.Item>
        </Select.Content>
      </Select>
    </div>
  );
}

function LoadingDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="flex w-72 flex-col gap-2">
      <Select isLoading={loading}>
        <Select.Trigger>
          <Select.Value placeholder="Loading options..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">A</Select.Item>
          <Select.Item value="b">B</Select.Item>
        </Select.Content>
      </Select>
      <button
        type="button"
        onClick={() => setLoading((v) => !v)}
        className="rounded-md border px-3 py-1 text-sm"
      >
        Toggle loading
      </button>
    </div>
  );
}

interface User {
  id: number;
  name: string;
  email: string;
}

function GenericObjectDemo() {
  const users: User[] = [
    { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
    { id: 2, name: 'Alan Turing', email: 'alan@example.com' },
    { id: 3, name: 'Grace Hopper', email: 'grace@example.com' },
  ];
  const [user, setUser] = useState<User | null>(null);
  return (
    <div className="w-80">
      <Select<User>
        value={user}
        onValueChange={setUser}
        isEqual={(a, b) => a.id === b.id}
        clearable
        serialize={(u) => String(u.id)}
        name="userId"
      >
        <Select.Trigger>
          <Select.Value placeholder="Pick a user...">
            {user && (
              <span className="truncate">
                {user.name} <span className="text-subtle-foreground">({user.email})</span>
              </span>
            )}
          </Select.Value>
        </Select.Trigger>
        <Select.Content searchable>
          {users.map((u) => (
            <Select.Item key={u.id} value={u} text={`${u.name} ${u.email}`}>
              <div className="flex flex-col">
                <span>{u.name}</span>
                <span className="text-xs text-subtle-foreground">{u.email}</span>
              </div>
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}

function SurfaceVariantsDemo() {
  const [value, setValue] = useState<string | null>(null);
  const variants = ['surface', 'solid', 'soft', 'outline', 'glass', 'elevated', 'flat'] as const;
  return (
    <div
      className="grid gap-4 p-8"
      style={{
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      }}
    >
      {variants.map((v) => (
        <div key={v} className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/90">{v}</div>
          <Select value={value} onValueChange={setValue}>
            <Select.Trigger>
              <Select.Value placeholder={`${v} panel`} />
            </Select.Trigger>
            <Select.Content variant={v}>
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="banana">Banana</Select.Item>
              <Select.Item value="cherry">Cherry</Select.Item>
            </Select.Content>
          </Select>
        </div>
      ))}
    </div>
  );
}

function IndicatorRadioDemo() {
  const [value, setValue] = useState<string | null>('apple');
  return (
    <div className="w-72">
      <Select value={value} onValueChange={setValue}>
        <Select.Trigger>
          <Select.Value placeholder="Pick one" />
        </Select.Trigger>
        <Select.Content>
          <Listbox.Item value="apple" indicator="radio">Apple</Listbox.Item>
          <Listbox.Item value="banana" indicator="radio">Banana</Listbox.Item>
          <Listbox.Item value="cherry" indicator="radio">Cherry</Listbox.Item>
        </Select.Content>
      </Select>
    </div>
  );
}

export const Default: Story = { render: () => <DefaultDemo /> };
export const Grouped: Story = { render: () => <GroupedDemo /> };
export const Searchable: Story = { render: () => <SearchableDemo /> };
export const Clearable: Story = { render: () => <ClearableDemo /> };
export const Loading: Story = { render: () => <LoadingDemo /> };
export const GenericObject: Story = { render: () => <GenericObjectDemo /> };
export const SurfaceVariants: Story = { render: () => <SurfaceVariantsDemo /> };
export const RadioIndicator: Story = { render: () => <IndicatorRadioDemo /> };

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
