import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Select, type SelectOption } from './Select';
import { Equality } from '../../utils';
import { FormField } from '../formField';

type TriggerSize = 'xs' | 'sm' | 'md' | 'lg';

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
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} isClearable>
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
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} isClearable>
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
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} isClearable>
        <Select.Trigger>
          <Select.Value placeholder="Search a fruit..." />
        </Select.Trigger>
        <Select.Content isSearchable searchPlaceholder="Type to filter…">
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
        isClearable
      >
        <Select.Trigger>
          <Select.Value placeholder="Pick a user..." />
        </Select.Trigger>
        <Select.Content isSearchable>
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

function TypeToSelectDemo() {
  /* Native <select> behaviour: focus the (closed) trigger and type a letter — the matching option
     is selected WITHOUT opening the popover. Prefix-match ("ch" → Cherry) and same-letter cycling
     ("b","b","b" → Banana → Blackberry → Blueberry) both work; the buffer resets after ~500ms. */
  const fruits = [
    'Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cherry',
    'Coconut', 'Cranberry', 'Date', 'Durian', 'Fig', 'Grape',
  ];
  const [k, setK] = useState<string | null>(null);
  return (
    <div className="flex w-72 flex-col gap-2">
      <p className="text-xs text-subtle-foreground">
        Focus the trigger (don’t open it) and type — “ch” selects Cherry; the list never opens.
      </p>
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} isClearable>
        <Select.Trigger>
          <Select.Value placeholder="Focus me and type…" />
        </Select.Trigger>
        <Select.Content>
          {fruits.map((f) => (
            <Select.Item key={f} itemKey={f.toLowerCase()} label={f} />
          ))}
        </Select.Content>
      </Select>
      <p className="text-xs text-subtle-foreground">Selected key: {k ?? '—'}</p>
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

const FRUITS = ['apple', 'banana', 'cherry', 'durian'] as const;
const FRUIT_LABELS: Record<string, string> = {
  apple: 'Apple',
  banana: 'Banana',
  cherry: 'Cherry',
  durian: 'Durian',
};

function FormFieldDemo() {
  /* Proves the new FormField wiring: the trigger inherits id + aria-describedby
     (helper/error) and is named by the field label — no manual aria plumbing. */
  const [k, setK] = useState<string | null>(null);
  const error = k === null ? 'Pick a fruit to continue.' : undefined;
  return (
    <div className="w-72">
      <FormField
        label="Favourite fruit"
        helper="One of the four on offer."
        error={error}
        isRequired
      >
        <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)} isClearable>
          <Select.Trigger>
            <Select.Value placeholder="Choose a fruit..." />
          </Select.Trigger>
          <Select.Content>
            {FRUITS.map((f) => (
              <Select.Item key={f} itemKey={f} label={FRUIT_LABELS[f]} />
            ))}
          </Select.Content>
        </Select>
      </FormField>
    </div>
  );
}

function DisabledOptionDemo() {
  /* `durian` is disabled — keyboard arrow nav skips it; clicking it is a no-op. */
  const [k, setK] = useState<string | null>(null);
  return (
    <div className="w-72">
      <Select<string> value={k} onValueChange={(opt) => setK(opt?.itemKey ?? null)}>
        <Select.Trigger>
          <Select.Value placeholder="Some are unavailable..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item itemKey="apple" label="Apple" />
          <Select.Item itemKey="banana" label="Banana" />
          <Select.Item itemKey="durian" label="Durian (sold out)" isDisabled />
          <Select.Item itemKey="cherry" label="Cherry" />
        </Select.Content>
      </Select>
    </div>
  );
}

function SizeMatrixDemo() {
  const sizes: TriggerSize[] = ['xs', 'sm', 'md', 'lg'];
  return (
    <div className="flex flex-col gap-3">
      {sizes.map((s) => (
        <div key={s} className="flex items-center gap-3">
          <span className="w-8 text-xs text-subtle-foreground">{s}</span>
          <div className="w-64">
            <Select<string> defaultValue="apple" isClearable getOptionLabel={(key) => FRUIT_LABELS[key as string]}>
              <Select.Trigger size={s}>
                <Select.Value placeholder="Pick one..." />
              </Select.Trigger>
              <Select.Content>
                {FRUITS.map((f) => (
                  <Select.Item key={f} itemKey={f} label={FRUIT_LABELS[f]} />
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}

function ControlledOpenDemo() {
  const [open, setOpen] = useState(false);
  const [k, setK] = useState<string | null>(null);
  return (
    <div className="flex w-72 flex-col gap-2">
      <Select<string>
        open={open}
        onOpenChange={setOpen}
        value={k}
        onValueChange={(opt) => setK(opt?.itemKey ?? null)}
      >
        <Select.Trigger>
          <Select.Value placeholder="Controlled open..." />
        </Select.Trigger>
        <Select.Content>
          {FRUITS.map((f) => (
            <Select.Item key={f} itemKey={f} label={FRUIT_LABELS[f]} />
          ))}
        </Select.Content>
      </Select>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border px-3 py-1 text-sm"
      >
        {open ? 'Close' : 'Open'} from outside
      </button>
      <p className="text-xs text-subtle-foreground">open = {String(open)}</p>
    </div>
  );
}

/* Two fixed remote pages — refetch swaps between them. The two share NO keys, so any option from
   the previous page must disappear from search / typeahead / value-resolution after the swap. */
const REMOTE_PAGES: Array<Array<{ key: string; label: string }>> = [
  [
    { key: 'u1', label: 'Ada Lovelace' },
    { key: 'u2', label: 'Alan Turing' },
    { key: 'u3', label: 'Grace Hopper' },
    { key: 'u4', label: 'Linus Torvalds' },
  ],
  [
    { key: 'u5', label: 'Margaret Hamilton' },
    { key: 'u6', label: 'Dennis Ritchie' },
    { key: 'u7', label: 'Barbara Liskov' },
  ],
];

function RemoteOptionsDemo() {
  /* Simulates an async remote source whose option set changes at runtime — the exact scenario the
     stale-registry fix targets. Pick someone from page 1, refetch to page 2: the trigger keeps the
     captured label, but the now-removed option no longer satisfies search or typeahead. */
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ key: string; label: string }>>([]);
  const [k, setK] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = (p: number) => {
    setLoading(true);
    setOptions([]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOptions(REMOTE_PAGES[p] ?? []);
      setLoading(false);
    }, 700);
  };

  /* Initial load; clean up the pending timer on unmount (SSR-safe — effect is client-only). */
  useEffect(() => {
    fetchPage(0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="flex w-80 flex-col gap-2">
      <Select<string>
        value={k}
        onValueChange={(opt) => setK(opt?.itemKey ?? null)}
        isLoading={loading}
        isClearable
      >
        <Select.Trigger>
          <Select.Value placeholder="Pick a person..." />
        </Select.Trigger>
        <Select.Content isSearchable searchPlaceholder="Search people…">
          {options.map((o) => (
            <Select.Item key={o.key} itemKey={o.key} label={o.label} />
          ))}
        </Select.Content>
      </Select>
      <button
        type="button"
        onClick={() => {
          const next = page === 0 ? 1 : 0;
          setPage(next);
          fetchPage(next);
        }}
        className="rounded-md border px-3 py-1 text-sm"
      >
        Refetch (load page {page === 0 ? 2 : 1})
      </button>
      <p className="text-xs text-subtle-foreground">
        Selected key: {k ?? '—'} · open search and confirm a previous page’s name is gone after refetch.
      </p>
    </div>
  );
}

const COUNTRY_CITIES: Record<string, Array<{ key: string; label: string }>> = {
  uz: [
    { key: 'tashkent', label: 'Tashkent' },
    { key: 'samarkand', label: 'Samarkand' },
    { key: 'bukhara', label: 'Bukhara' },
  ],
  jp: [
    { key: 'tokyo', label: 'Tokyo' },
    { key: 'osaka', label: 'Osaka' },
    { key: 'kyoto', label: 'Kyoto' },
  ],
  de: [
    { key: 'berlin', label: 'Berlin' },
    { key: 'munich', label: 'Munich' },
    { key: 'hamburg', label: 'Hamburg' },
  ],
};

function DependentDropdownDemo() {
  /* Dependent dropdowns: changing the country swaps the city options at runtime. The previously
     selected city must clear and must not linger in the city dropdown's search/typeahead. */
  const [country, setCountry] = useState<string | null>('uz');
  const [city, setCity] = useState<string | null>(null);
  const cities = country ? COUNTRY_CITIES[country] ?? [] : [];

  return (
    <div className="flex w-72 flex-col gap-3">
      <Select<string>
        value={country}
        onValueChange={(opt) => {
          setCountry(opt?.itemKey ?? null);
          setCity(null); // reset child when parent changes
        }}
      >
        <Select.Trigger>
          <Select.Value placeholder="Country..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item itemKey="uz" label="Uzbekistan" />
          <Select.Item itemKey="jp" label="Japan" />
          <Select.Item itemKey="de" label="Germany" />
        </Select.Content>
      </Select>
      <Select<string> value={city} onValueChange={(opt) => setCity(opt?.itemKey ?? null)}>
        <Select.Trigger>
          <Select.Value placeholder={country ? 'City...' : 'Pick a country first'} />
        </Select.Trigger>
        <Select.Content isSearchable searchPlaceholder="Search cities…">
          {cities.map((c) => (
            <Select.Item key={c.key} itemKey={c.key} label={c.label} />
          ))}
        </Select.Content>
      </Select>
      <p className="text-xs text-subtle-foreground">
        Country: {country ?? '—'} · City: {city ?? '—'}
      </p>
    </div>
  );
}

interface PlaygroundArgs {
  size: TriggerSize;
  isDisabled: boolean;
  isLoading: boolean;
  isClearable: boolean;
  isInvalid: boolean;
  isSearchable: boolean;
  matchWidth: boolean;
  placeholder: string;
}

function PlaygroundDemo(args: PlaygroundArgs) {
  const [k, setK] = useState<string | null>('apple');
  return (
    <div className="w-72">
      <Select<string>
        value={k}
        onValueChange={(opt) => setK(opt?.itemKey ?? null)}
        isDisabled={args.isDisabled}
        isLoading={args.isLoading}
        isClearable={args.isClearable}
        isInvalid={args.isInvalid}
        getOptionLabel={(key) => FRUIT_LABELS[key as string]}
      >
        <Select.Trigger size={args.size}>
          <Select.Value placeholder={args.placeholder} />
        </Select.Trigger>
        <Select.Content isSearchable={args.isSearchable} matchWidth={args.matchWidth}>
          {FRUITS.map((f) => (
            <Select.Item key={f} itemKey={f} label={FRUIT_LABELS[f]} />
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}

export const Default: Story = { render: () => <DefaultDemo /> };
export const Grouped: Story = { render: () => <GroupedDemo /> };
export const Clearable: Story = { render: () => <ClearableDemo /> };
export const MetaInItem: Story = { render: () => <MetaInItemDemo /> };
export const Searchable: Story = { render: () => <SearchableDemo /> };
export const TypeToSelect: Story = { render: () => <TypeToSelectDemo /> };
export const Loading: Story = { render: () => <LoadingDemo /> };
export const KvSplit: Story = { render: () => <KvSplitDemo /> };
export const InFormField: Story = { render: () => <FormFieldDemo /> };
export const DisabledOption: Story = { render: () => <DisabledOptionDemo /> };
export const SizeMatrix: Story = { render: () => <SizeMatrixDemo /> };
export const ControlledOpen: Story = { render: () => <ControlledOpenDemo /> };
export const RemoteOptions: Story = { render: () => <RemoteOptionsDemo /> };
export const DependentDropdown: Story = { render: () => <DependentDropdownDemo /> };

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <Select<string> isInvalid>
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

export const InvalidWithError: Story = {
  /* `FormField error=…` flips the context to invalid; the trigger reflects it as
     `state='invalid'` + `aria-invalid` and ships `aria-describedby` to the message. */
  render: () => (
    <div className="w-72">
      <FormField label="Plan" error="Choose a plan before saving.">
        <Select<string>>
          <Select.Trigger>
            <Select.Value placeholder="Select a plan..." />
          </Select.Trigger>
          <Select.Content>
            <Select.Item itemKey="free" label="Free" />
            <Select.Item itemKey="pro" label="Pro" />
            <Select.Item itemKey="team" label="Team" />
          </Select.Content>
        </Select>
      </FormField>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <Select<string>
        isDisabled
        defaultValue="apple"
        getOptionLabel={(key) => FRUIT_LABELS[key as string]}
      >
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

export const Playground: Story = {
  args: {
    size: 'md',
    isDisabled: false,
    isLoading: false,
    isClearable: true,
    isInvalid: false,
    isSearchable: false,
    matchWidth: false,
    placeholder: 'Pick a fruit...',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isClearable: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    isSearchable: { control: 'boolean' },
    matchWidth: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  render: (args) => <PlaygroundDemo {...(args as unknown as PlaygroundArgs)} />,
};
