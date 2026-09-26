import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { PointControl, type PointControlValue } from '@src/presentation/forms/pointControl';

const meta: Meta<typeof PointControl> = {
  title: 'Forms/PointControl',
  component: PointControl,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PointControl>;

function Demo() {
  const [value, setValue] = useState<PointControlValue>({ x: 0.5, y: 0.5 });
  return (
    <div className="w-72 space-y-3">
      <PointControl
        aria-label="Pattern anchor"
        value={value}
        onValueChange={setValue}
        className="bg-gradient-to-br from-rose-200 via-amber-100 to-emerald-200"
      />
      <output className="block text-sm text-muted-foreground">
        x {value.x.toFixed(2)} · y {value.y.toFixed(2)}
      </output>
    </div>
  );
}

export const Default: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole('slider', { name: 'Pattern anchor' });
    control.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');
    await expect(control).toHaveAttribute('aria-valuetext', 'x 51%, y 51%');
    await expect(canvas.getByText('x 0.51 · y 0.51')).toBeVisible();
  },
};
