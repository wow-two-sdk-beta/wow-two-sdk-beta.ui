import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { MultiSelect } from '@src/presentation/forms/multiSelect/MultiSelect';

const meta: Meta<typeof MultiSelect> = {
  title: 'Forms/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MultiSelect>;

function DefaultDemo() {
  const [values, setValues] = useState<readonly string[]>([]);
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
  const [values, setValues] = useState<readonly string[]>(['apple', 'cherry']);
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

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/** Fixed 3-option multi-select — `onValueChange` arrives via args (spy); uncontrolled value. */
function interactionMultiSelect(args: {
  onValueChange?: (value: readonly string[]) => void;
  defaultValue?: readonly string[];
}) {
  return (
    <div className="w-80">
      <MultiSelect defaultValue={args.defaultValue} onValueChange={args.onValueChange}>
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

export const ClickingOptionsTogglesChips: Story = {
  args: { onValueChange: fn() },
  render: (args) => interactionMultiSelect(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    /* The popover portals into document.body — canvas queries can't reach it. */
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button');
    await expect(trigger).toHaveTextContent('Pick fruits...');

    await userEvent.click(trigger);
    await body.findByRole('listbox');

    /* Each pick appends to the array and re-fires the spy — the panel STAYS open. */
    await userEvent.click(body.getByRole('option', { name: 'Apple' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['apple']);
    await userEvent.click(body.getByRole('option', { name: 'Cherry' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['apple', 'cherry']);
    await expect(body.getByRole('listbox')).toBeInTheDocument();

    /* Chips render inside the trigger; picked options are marked selected. */
    await expect(trigger).toHaveTextContent('Apple');
    await expect(trigger).toHaveTextContent('Cherry');
    await expect(body.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(body.getByRole('option', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'false',
    );

    /* Clicking a selected option deselects it — its chip disappears. */
    await userEvent.click(body.getByRole('option', { name: 'Apple' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['cherry']);
    await expect(trigger).not.toHaveTextContent('Apple');
  },
};

export const ChipRemoveButtonDeselects: Story = {
  args: { onValueChange: fn() },
  /* Chips show raw values here: labels register when items first mount (popover never opens). */
  render: (args) => interactionMultiSelect({ ...args, defaultValue: ['apple', 'banana'] }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    /* Chip × spans are role=button INSIDE the trigger — document order puts the trigger first. */
    const trigger = canvas.getAllByRole('button')[0]!;
    await expect(trigger).toHaveTextContent('apple');

    /* × removes exactly that value — without ever opening the popover. */
    await userEvent.click(canvas.getByRole('button', { name: 'Remove apple' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith(['banana']);
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(trigger).not.toHaveTextContent('apple');
    await expect(trigger).toHaveTextContent('banana');
  },
};

export const BackspaceRemovesLastChip: Story = {
  args: { onValueChange: fn() },
  render: (args) => interactionMultiSelect({ ...args, defaultValue: ['apple', 'banana'] }),
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getAllByRole('button')[0]!;
    trigger.focus();

    await userEvent.keyboard('{Backspace}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['apple']);
    await userEvent.keyboard('{Backspace}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith([]);
    /* All chips gone — the placeholder returns; a further Backspace is a no-op. */
    await expect(trigger).toHaveTextContent('Pick fruits...');
    await userEvent.keyboard('{Backspace}');
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
  },
};

export const EscapeClosesAndChipLabelsPersist: Story = {
  render: (args) => interactionMultiSelect(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button');

    await userEvent.click(trigger);
    await body.findByRole('listbox');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(body.getByRole('option', { name: 'Banana' }));

    await userEvent.keyboard('{Escape}');
    /* Close unmounts after the exit animation… */
    await waitFor(() => expect(body.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    /* …and the chip keeps its registered label even though the items unmounted. */
    await expect(trigger).toHaveTextContent('Banana');
  },
};
