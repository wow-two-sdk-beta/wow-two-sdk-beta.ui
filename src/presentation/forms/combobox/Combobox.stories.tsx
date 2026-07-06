import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/** Filterable fruit combobox — filtering is consumer-driven; the selection spy arrives via args. */
function FilterableCombobox({ onValueChange }: { onValueChange?: (value: string) => void }) {
  const [input, setInput] = useState('');
  const matches = FRUITS.filter((f) => f.label.toLowerCase().includes(input.toLowerCase()));
  return (
    <div className="w-72">
      <Combobox onValueChange={onValueChange} inputValue={input} onInputChange={setInput}>
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

export const TypingFiltersOptions: Story = {
  render: (args) => <FilterableCombobox onValueChange={args.onValueChange} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* The panel portals into document.body — canvas queries can't reach it. */
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox');
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    /* Typing opens the panel; only the consumer-filtered matches render. */
    await userEvent.type(input, 'ban');
    await body.findByRole('listbox');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(body.getAllByRole('option')).toHaveLength(1));
    await expect(body.getByRole('option', { name: 'Banana' })).toBeInTheDocument();

    /* No match left → the Empty slot renders instead of matches. It is itself
       a disabled option (a listbox must own at least one option), so exactly
       one option remains: the placeholder. */
    await userEvent.type(input, 'zzz');
    await waitFor(() => expect(body.getAllByRole('option')).toHaveLength(1));
    const empty = body.getByRole('option', { name: 'No matches' });
    await expect(empty).toHaveAttribute('aria-disabled', 'true');
  },
};

export const ArrowKeysMoveActiveAndEnterSelects: Story = {
  args: { onValueChange: fn() },
  render: (args) => <FilterableCombobox onValueChange={args.onValueChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox');

    /* Focusing the input opens the panel. */
    await userEvent.click(input);
    await body.findByRole('listbox');
    const options = body.getAllByRole('option');
    await expect(options).toHaveLength(8);
    /* First enabled option auto-actives; DOM focus STAYS on the input (active-descendant pattern). */
    await waitFor(() => expect(options[0]).toHaveAttribute('data-active'));
    await expect(input).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(options[1]).toHaveAttribute('data-active');
    await expect(options[0]).not.toHaveAttribute('data-active');
    /* aria-activedescendant mirrors the active option id. */
    await expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id);

    /* Enter commits the active option: spy fires with the value, input fills with the label. */
    await userEvent.keyboard('{Enter}');
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('banana');
    await expect(input).toHaveValue('Banana');
    /* Selection closes the panel (unmount waits for the exit animation). */
    await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  },
};

export const ClickSelectsOption: Story = {
  args: { onValueChange: fn() },
  render: (args) => <FilterableCombobox onValueChange={args.onValueChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox');

    await userEvent.click(input);
    await body.findByRole('listbox');
    await userEvent.click(body.getByRole('option', { name: 'Cherry' }));

    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('cherry');
    await expect(input).toHaveValue('Cherry');
    await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());

    /* Reopening marks the picked option as selected. */
    await userEvent.click(input);
    await body.findByRole('listbox');
    await expect(body.getByRole('option', { name: 'Cherry' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};

export const EscapeClosesThenClearsInput: Story = {
  render: (args) => <FilterableCombobox onValueChange={args.onValueChange} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox');

    await userEvent.type(input, 'ap');
    await body.findByRole('listbox');

    /* First Escape closes the panel and keeps the typed text. */
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveValue('ap');

    /* Second Escape (panel already closed) clears the input text. */
    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveValue('');
  },
};
