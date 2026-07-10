import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
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

/* ------------------------------------------------------------------------- *
 * Interaction test (play) — oracle: ControlGroup.tsx + ControlGroup.variants.
 * The component is NON-interactive (no state, no handlers) and carries no
 * grouping ARIA (no role/aria-labelledby — the label↔control binding is
 * visual only), so this is a structural-contract check: orientation drives
 * the flex axis, `labelWidth` pins the label column, and `divided` draws the
 * hairline between adjacent groups but not after the last.
 * ------------------------------------------------------------------------- */

export const StructuralLayoutContract: Story = {
  render: () => (
    <div className="w-80">
      <ControlGroup data-testid="row-fill" label="Fill" labelWidth="7rem">
        <span className="text-sm">Solid</span>
      </ControlGroup>
      <ControlGroup data-testid="row-opacity" label="Opacity" labelWidth="7rem">
        <span className="text-sm">100%</span>
      </ControlGroup>
      <ControlGroup data-testid="row-colors" label="Colors" orientation="vertical">
        <span className="text-sm">Swatches</span>
      </ControlGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fill = canvas.getByTestId('row-fill');
    const opacity = canvas.getByTestId('row-opacity');
    const colors = canvas.getByTestId('row-colors');

    // Label + control render side by side on the horizontal axis…
    await expect(within(fill).getByText('Fill')).toBeVisible();
    await expect(within(fill).getByText('Solid')).toBeVisible();
    await expect(getComputedStyle(fill).flexDirection).toBe('row');

    // …and stacked on the vertical one.
    await expect(getComputedStyle(colors).flexDirection).toBe('column');

    // labelWidth pins the label column for cross-row alignment (7rem = 112px).
    const fillLabel = within(fill).getByText('Fill');
    await expect(getComputedStyle(fillLabel).flexBasis).toBe('112px');
    await expect(fillLabel.getBoundingClientRect().width).toBe(112);

    // divided (default) draws a hairline between adjacent groups, none after the last.
    await expect(getComputedStyle(fill).borderBottomWidth).toBe('1px');
    await expect(getComputedStyle(opacity).borderBottomWidth).toBe('1px');
    await expect(getComputedStyle(colors).borderBottomWidth).toBe('0px');
  },
};
