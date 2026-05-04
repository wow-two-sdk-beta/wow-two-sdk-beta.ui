import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorPicker } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'Forms/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorPicker>;

function Demo() {
  const [color, setColor] = useState<string | null>('#3b82f6');
  return (
    <div className="flex flex-col gap-3 p-4">
      <ColorPicker value={color} onChange={setColor} />
      <p className="text-sm text-muted-foreground">Value: {color}</p>
    </div>
  );
}

const PRESETS = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#71717a',
];

export const Default: Story = { render: () => <Demo /> };

export const WithAlpha: Story = {
  render: () => (
    <div className="p-4">
      <ColorPicker withAlpha defaultValue="#3b82f680" />
    </div>
  ),
};

export const WithPresets: Story = {
  render: () => (
    <div className="p-4">
      <ColorPicker presets={PRESETS} />
    </div>
  ),
};
