import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorSlider } from './ColorSlider';

const meta: Meta<typeof ColorSlider> = {
  title: 'Forms/ColorSlider',
  component: ColorSlider,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorSlider>;

function HueDemo() {
  const [hue, setHue] = useState(180);
  return (
    <div className="flex flex-col gap-3 w-80">
      <ColorSlider channel="hue" value={hue} onChange={setHue} aria-label="Hue" />
      <p className="text-sm text-muted-foreground">Hue: {Math.round(hue)}°</p>
    </div>
  );
}

function SaturationDemo() {
  const [s, setS] = useState(0.6);
  return (
    <div className="flex flex-col gap-3 w-80">
      <ColorSlider
        channel="saturation"
        value={s}
        onChange={setS}
        color={{ h: 200, s: 1, v: 1 }}
        aria-label="Saturation"
      />
      <p className="text-sm text-muted-foreground">Saturation: {(s * 100).toFixed(0)}%</p>
    </div>
  );
}

function AlphaDemo() {
  const [a, setA] = useState(0.5);
  return (
    <div className="flex flex-col gap-3 w-80">
      <ColorSlider
        channel="alpha"
        value={a}
        onChange={setA}
        color={{ h: 0, s: 0.9, v: 0.9 }}
        aria-label="Alpha"
      />
      <p className="text-sm text-muted-foreground">Alpha: {(a * 100).toFixed(0)}%</p>
    </div>
  );
}

export const Hue: Story = { render: () => <HueDemo /> };
export const Saturation: Story = { render: () => <SaturationDemo /> };
export const Alpha: Story = { render: () => <AlphaDemo /> };
