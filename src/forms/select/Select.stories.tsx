import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select, type SelectOption } from './Select';
import { Equality } from '../../utils';

const meta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select as never,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Select>;

function DefaultDemo() {
  const [k, setK] = useState<string | null>(null);
  return (
    <div className="w-72">
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)}>
        <Select.Trigger>
          <Select.Value placeholder="Choose a fruit..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item itemKey="apple" label="Apple" />
          <Select.Item itemKey="banana" label="Banana" />
          <Select.Item itemKey="cherry" label="Cherry" />
          <Select.Item itemKey="durian" label="Durian" />
        </Select.Content>
      </Select>
    </div>
  );
}

function GroupedDemo() {
  const [k, setK] = useState<string | null>('apple');
  return (
    <div className="w-72">
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)}>
        <Select.Trigger>
          <Select.Value placeholder="Pick food..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Group label="Fruits">
            <Select.Item itemKey="apple" label="Apple" />
            <Select.Item itemKey="banana" label="Banana" />
          </Select.Group>
          <Select.Separator />
          <Select.Group label="Vegetables">
            <Select.Item itemKey="carrot" label="Carrot" />
            <Select.Item itemKey="broccoli" label="Broccoli" />
          </Select.Group>
        </Select.Content>
      </Select>
    </div>
  );
}

function ClearableDemo() {
  const [k, setK] = useState<string | null>('apple');
  return (
    <div className="w-72">
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} clearable>
        <Select.Trigger size="sm">
          <Select.Value placeholder="Pick one..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item itemKey="apple" label="Apple" />
          <Select.Item itemKey="banana" label="Banana" />
          <Select.Item itemKey="cherry" label="Cherry" />
        </Select.Content>
      </Select>
    </div>
  );
}

function MetaInItemDemo() {
  /* Common pattern: option carries label + count.
     Trigger shows ONLY the label; item shows label + count. */
  const opts: Array<{ key: string; label: string; count: number }> = [
    { key: 'apple', label: 'Apple', count: 12 },
    { key: 'banana', label: 'Banana', count: 7 },
    { key: 'cherry', label: 'Cherry', count: 24 },
  ];
  const [k, setK] = useState<string | null>(null);
  return (
    <div className="w-72">
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} clearable>
        <Select.Trigger size="xs" className="w-40">
          <Select.Value placeholder="All" />
        </Select.Trigger>
        <Select.Content>
          {opts.map((o) => (
            <Select.Item key={o.key} itemKey={o.key} label={o.label}>
              <span className="flex-1">{o.label}</span>
              <span className="ml-2 text-xs text-subtle-foreground">{o.count}</span>
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}

function SearchableDemo() {
  const [k, setK] = useState<string | null>(null);
  const fruits = [
    'Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cherry',
    'Coconut', 'Cranberry', 'Date', 'Durian', 'Elderberry', 'Fig',
    'Grape', 'Grapefruit', 'Guava', 'Kiwi', 'Lemon', 'Lime', 'Mango',
  ];
  return (
    <div className="w-72">
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} clearable>
        <Select.Trigger>
          <Select.Value placeholder="Search a fruit..." />
        </Select.Trigger>
        <Select.Content searchable searchPlaceholder="Type to filter…">
          {fruits.map((f) => (
            <Select.Item key={f} itemKey={f.toLowerCase()} label={f} />
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}

interface User {
  id: number;
  name: string;
  email: string;
}

function KvSplitDemo() {
  /* K = number (user id), V = User (rich payload). */
  const users: User[] = [
    { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
    { id: 2, name: 'Alan Turing', email: 'alan@example.com' },
    { id: 3, name: 'Grace Hopper', email: 'grace@example.com' },
  ];
  const [pick, setPick] = useState<SelectOption<number, User> | null>(null);
  return (
    <div className="w-80">
      <Select<number, User>
        value={pick?.itemKey ?? null}
        onValueChange={setPick}
        keyEquals={Equality.strictEquals}
        clearable
      >
        <Select.Trigger>
          <Select.Value placeholder="Pick a user..." />
        </Select.Trigger>
        <Select.Content searchable>
          {users.map((u) => (
            <Select.Item<number, User>
              key={u.id}
              itemKey={u.id}
              value={u}
              label={u.name}
              text={`${u.name} ${u.email}`}
            >
              <div className="flex flex-col">
                <span>{u.name}</span>
                <span className="text-xs text-subtle-foreground">{u.email}</span>
              </div>
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      {pick && (
        <pre className="mt-3 text-xs">
          {JSON.stringify({ key: pick.itemKey, value: pick.value }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function LoadingDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="flex w-72 flex-col gap-2">
      <Select<string> isLoading={loading}>
        <Select.Trigger>
          <Select.Value placeholder="Loading options..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item itemKey="a" label="A" />
          <Select.Item itemKey="b" label="B" />
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

export const Default: Story = { render: () => <DefaultDemo /> };
export const Grouped: Story = { render: () => <GroupedDemo /> };
export const Clearable: Story = { render: () => <ClearableDemo /> };
export const MetaInItem: Story = { render: () => <MetaInItemDemo /> };
export const Searchable: Story = { render: () => <SearchableDemo /> };
export const Loading: Story = { render: () => <LoadingDemo /> };
export const KvSplit: Story = { render: () => <KvSplitDemo /> };

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <Select<string> invalid>
        <Select.Trigger>
          <Select.Value placeholder="Required field" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item itemKey="a" label="Option A" />
          <Select.Item itemKey="b" label="Option B" />
        </Select.Content>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <Select<string> disabled defaultValue="apple">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item itemKey="apple" label="Apple" />
        </Select.Content>
      </Select>
    </div>
  ),
};
