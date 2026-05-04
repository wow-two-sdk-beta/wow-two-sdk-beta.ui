import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GradientPicker, type Gradient, gradientToCss } from './GradientPicker';

const meta: Meta<typeof GradientPicker> = {
  title: 'Forms/GradientPicker',
  component: GradientPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof GradientPicker>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [g, setG] = useState<Gradient>({
        kind: 'linear',
        angle: 135,
        stops: [
          { color: '#06b6d4', position: 0 },
          { color: '#a855f7', position: 100 },
        ],
      });
      return (
        <div className="grid grid-cols-2 gap-6">
          <GradientPicker value={g} onValueChange={setG} />
          <div>
            <div
              className="h-48 w-full rounded-md border border-border"
              style={{ background: gradientToCss(g) }}
            />
            <p className="mt-2 text-xs text-muted-foreground">Live preview</p>
          </div>
        </div>
      );
    }
    return <Demo />;
  },
};
