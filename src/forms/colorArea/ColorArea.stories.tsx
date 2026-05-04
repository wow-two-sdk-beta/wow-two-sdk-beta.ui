import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorArea } from './ColorArea';
import { hsvToHex } from '../ColorExtensions';

const meta: Meta<typeof ColorArea> = {
  title: 'Forms/ColorArea',
  component: ColorArea,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorArea>;

function Demo() {
  const hue = 200;
  const [{ s, v }, setSV] = useState({ s: 0.6, v: 0.6 });
  return (
    <div className="flex flex-col gap-3 w-72">
      <ColorArea
        hue={hue}
        saturation={s}
        value={v}
        onChange={({ saturation, value }) => setSV({ s: saturation, v: value })}
      />
      <p className="text-sm text-muted-foreground">
        Saturation: {(s * 100).toFixed(0)}% · Value: {(v * 100).toFixed(0)}%
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Color:</span>
        <code className="text-sm">{hsvToHex({ h: hue, s, v })}</code>
      </div>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };
