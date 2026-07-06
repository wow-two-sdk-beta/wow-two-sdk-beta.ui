import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Sortable, type SortableProps } from './Sortable';

const meta: Meta<typeof Sortable> = {
  title: 'Display/Sortable',
  component: Sortable,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[24rem]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Sortable>;

const reorder = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const clamped = Math.max(0, Math.min(next.length - 1, to));
  const [item] = next.splice(from, 1);
  if (item === undefined) return next;
  next.splice(clamped, 0, item);
  return next;
};

const SortableDemo = () => {
  const [items, setItems] = useState(['Country = UZ', 'Device = iOS', 'Language = ru', 'Time 9–18']);
  return (
    <Sortable className="gap-2" onReorder={(from, to) => setItems((prev) => reorder(prev, from, to))}>
      {items.map((label, i) => (
        <Sortable.Item
          key={label}
          index={i}
          className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 data-[over]:border-primary"
        >
          <Sortable.Handle>
            <GripVertical size={16} />
          </Sortable.Handle>
          <span className="text-sm">{label}</span>
        </Sortable.Item>
      ))}
    </Sortable>
  );
};

export const Default: Story = {
  render: () => <SortableDemo />,
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Sortable.tsx source.
 * Pointer reordering rides the native HTML5 drag-and-drop API (dragstart /
 * dragover / drop), which synthetic pointer events cannot trigger — so the
 * drag path is covered up to the arming contract (`draggable` while a handle
 * is pressed) and reordering itself is exercised through the keyboard path.
 * ------------------------------------------------------------------------- */

const InteractionDemo = ({ onReorder }: { onReorder?: SortableProps['onReorder'] }) => {
  const [items, setItems] = useState(['Alpha', 'Beta', 'Gamma']);
  return (
    <Sortable
      className="gap-2"
      onReorder={(from, to) => {
        onReorder?.(from, to);
        setItems((prev) => reorder(prev, from, to));
      }}
    >
      {items.map((label, i) => (
        <Sortable.Item
          key={label}
          index={i}
          className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
        >
          <Sortable.Handle aria-label={`Reorder ${label}`}>
            <GripVertical size={16} />
          </Sortable.Handle>
          <span data-testid="sortable-label" className="text-sm">{label}</span>
        </Sortable.Item>
      ))}
    </Sortable>
  );
};

export const KeyboardReorderViaHandle: Story = {
  args: { onReorder: fn() },
  render: (args) => <InteractionDemo onReorder={args.onReorder} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const order = () => canvas.getAllByTestId('sortable-label').map((el) => el.textContent);

    await expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);

    // Focus Alpha's handle; ArrowDown moves the row one position down.
    const handle = canvas.getByRole('button', { name: 'Reorder Alpha' });
    await userEvent.click(handle);
    await expect(handle).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onReorder).toHaveBeenLastCalledWith(0, 1);
    await expect(order()).toEqual(['Beta', 'Alpha', 'Gamma']);

    // The handle keeps focus across the re-render (stable key), so the next
    // ArrowDown moves the same row again.
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onReorder).toHaveBeenLastCalledWith(1, 2);
    await expect(order()).toEqual(['Beta', 'Gamma', 'Alpha']);

    // ArrowUp moves it back up.
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.onReorder).toHaveBeenLastCalledWith(2, 1);
    await expect(order()).toEqual(['Beta', 'Alpha', 'Gamma']);
    await expect(args.onReorder).toHaveBeenCalledTimes(3);
  },
};

export const KeyboardRespectsListEdges: Story = {
  args: { onReorder: fn() },
  render: (args) => <InteractionDemo onReorder={args.onReorder} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const order = () => canvas.getAllByTestId('sortable-label').map((el) => el.textContent);

    // ArrowUp on the first row is a no-op (guarded before onReorder fires).
    await userEvent.click(canvas.getByRole('button', { name: 'Reorder Alpha' }));
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.onReorder).not.toHaveBeenCalled();
    await expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);

    // ArrowDown on the last row emits raw indices (contract: consumer clamps),
    // so the visible order is unchanged.
    await userEvent.click(canvas.getByRole('button', { name: 'Reorder Gamma' }));
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onReorder).toHaveBeenCalledTimes(1);
    await expect(args.onReorder).toHaveBeenLastCalledWith(2, 3);
    await expect(order()).toEqual(['Alpha', 'Beta', 'Gamma']);
  },
};

export const PressingHandleArmsRowForDrag: Story = {
  args: { onReorder: fn() },
  render: (args) => <InteractionDemo onReorder={args.onReorder} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('button', { name: 'Reorder Alpha' });
    const row = handle.closest('[draggable]');

    // Rows are draggable only while a handle is pressed — keeps row content
    // (inputs, selects) interactive when not dragging.
    await expect(row).toHaveAttribute('draggable', 'false');
    await userEvent.pointer({ keys: '[MouseLeft>]', target: handle });
    await expect(row).toHaveAttribute('draggable', 'true');
    // Focus leaving the handle disarms it (blur path — the direct userEvent
    // API is stateless across calls, so the release is driven via blur).
    await userEvent.tab();
    await expect(row).toHaveAttribute('draggable', 'false');
  },
};
