import type { Meta, StoryObj } from '@storybook/react';
import { ControlGroup } from './ControlGroup';

const meta: Meta<typeof ControlGroup> = {
  title: 'Layout/ControlGroup',
  component: ControlGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ControlGroup>;

/* Horizontal rows auto-divide when stacked; the last row has no hairline. */
export const Horizontal: Story = {
  render: () => (
    <div className="w-80">
      <ControlGroup label="Fill">
        <span className="text-sm">Solid</span>
      </ControlGroup>
      <ControlGroup label="Opacity">
        <span className="text-sm">100%</span>
      </ControlGroup>
      <ControlGroup label="Angle">
        <span className="text-sm">45°</span>
      </ControlGroup>
    </div>
  ),
};

/* Vertical — label above a wide control. */
export const Vertical: Story = {
  render: () => (
    <div className="w-80">
      <ControlGroup label="Colors" orientation="vertical">
        <div className="flex gap-2">
          <span className="h-6 w-6 rounded bg-primary" />
          <span className="h-6 w-6 rounded bg-muted" />
          <span className="h-6 w-6 rounded bg-foreground" />
        </div>
      </ControlGroup>
    </div>
  ),
};

/* Fixed label width aligns the control columns across rows. */
export const AlignedLabels: Story = {
  render: () => (
    <div className="w-80">
      <ControlGroup label="Foreground" labelWidth="7rem">
        <span className="text-sm">#000000</span>
      </ControlGroup>
      <ControlGroup label="Background" labelWidth="7rem">
        <span className="text-sm">#ffffff</span>
      </ControlGroup>
    </div>
  ),
};
