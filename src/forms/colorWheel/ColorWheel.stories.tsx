import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorWheel } from './ColorWheel';

const meta: Meta<typeof ColorWheel> = {
  title: 'Forms/ColorWheel',
  component: ColorWheel,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorWheel>;

function Demo() {
  const [hue, setHue] = useState(0);
  return (
    <div className="flex flex-col items-center gap-3">
      <ColorWheel value={hue} onChange={setHue} />
      <p className="text-sm text-muted-foreground">Hue: {Math.round(hue)}°</p>
    </div>
  );
}

function SmallDemo() {
  return <ColorWheel size={120} thickness={18} defaultValue={120} />;
}

export const Default: Story = { render: () => <Demo /> };
export const Small: Story = { render: () => <SmallDemo /> };
