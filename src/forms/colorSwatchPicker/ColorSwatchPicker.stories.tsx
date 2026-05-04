import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorSwatchPicker } from './ColorSwatchPicker';

const meta: Meta<typeof ColorSwatchPicker> = {
  title: 'Forms/ColorSwatchPicker',
  component: ColorSwatchPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorSwatchPicker>;

const PALETTE = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#71717a',
];

function Demo() {
  const [color, setColor] = useState<string | null>('#3b82f6');
  return (
    <div className="flex flex-col gap-3 w-72">
      <ColorSwatchPicker colors={PALETTE} value={color} onChange={setColor} />
      <p className="text-sm text-muted-foreground">Selected: {color ?? 'none'}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const Circles: Story = {
  render: () => (
    <ColorSwatchPicker colors={PALETTE} swatchShape="circle" defaultValue="#22c55e" />
  ),
};
