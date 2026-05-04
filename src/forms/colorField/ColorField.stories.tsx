import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorField } from './ColorField';

const meta: Meta<typeof ColorField> = {
  title: 'Forms/ColorField',
  component: ColorField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorField>;

function Demo() {
  const [color, setColor] = useState<string | null>('#3b82f6');
  return (
    <div className="flex flex-col gap-3 w-72">
      <ColorField value={color} onChange={setColor} />
      <p className="text-sm text-muted-foreground">Value: {color ?? 'none'}</p>
    </div>
  );
}

function AlphaDemo() {
  const [color, setColor] = useState<string | null>('#3b82f680');
  return (
    <div className="flex flex-col gap-3 w-72">
      <ColorField value={color} onChange={setColor} withAlpha />
      <p className="text-sm text-muted-foreground">Value: {color ?? 'none'}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };
export const WithAlpha: Story = { render: () => <AlphaDemo /> };

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <ColorField state="invalid" placeholder="#000000" />
    </div>
  ),
};
