import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { Sortable } from './Sortable';

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
