import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Knob } from './Knob';

const meta: Meta<typeof Knob> = {
  title: 'Forms/Knob',
  component: Knob,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Knob>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [v, setV] = useState(0.5);
      return (
        <div className="flex items-center gap-4">
          <Knob value={v} onValueChange={setV} aria-label="Volume" />
          <span className="text-sm tabular-nums text-muted-foreground">{v.toFixed(2)}</span>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <Knob defaultValue={0.3} size={48} aria-label="Small" />
      <Knob defaultValue={0.5} size={64} aria-label="Medium" />
      <Knob defaultValue={0.75} size={96} aria-label="Large" />
      <Knob defaultValue={0.9} size={128} aria-label="XL" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex gap-4">
      <Knob defaultValue={0.4} tone="brand" />
      <Knob defaultValue={0.7} tone="success" />
      <Knob defaultValue={0.5} tone="warning" />
      <Knob defaultValue={0.9} tone="danger" />
      <Knob defaultValue={0.3} tone="muted" />
    </div>
  ),
};

export const FullSweep: Story = {
  render: () => <Knob defaultValue={0.5} arcDegrees={360} size={96} />,
};

export const RangedNumeric: Story = {
  render: () => (
    <Knob
      defaultValue={45}
      min={0}
      max={100}
      step={1}
      largeStep={10}
      format={(v) => `${Math.round(v)}°`}
      size={96}
    />
  ),
};
