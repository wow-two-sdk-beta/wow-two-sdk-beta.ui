import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ToggleButton } from '../toggleButton/ToggleButton';
import { ToggleItemRole } from '../toggleButtonGroup/ToggleButtonGroup.variants';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Actions/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: () => (
    <SegmentedControl type="single" defaultValue="week">
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </SegmentedControl>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — SegmentedControl is a deprecated thin alias of
 * `ToggleButtonGroup variant="segmented"`; these lock the pass-through.
 * ------------------------------------------------------------------------- */

/** Click selects a segment — default semantics are a `group` of `aria-pressed` toggle buttons. */
export const ClickSelectsSegment: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <SegmentedControl
      type="single"
      defaultValue="week"
      onValueChange={args.onValueChange as (value: string | null) => void}
      aria-label="View range"
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </SegmentedControl>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'View range' })).toBeInTheDocument();

    const week = canvas.getByRole('button', { name: 'Week' });
    const month = canvas.getByRole('button', { name: 'Month' });
    await expect(week).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(month);
    await expect(month).toHaveAttribute('aria-pressed', 'true');
    await expect(week).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('month');
  },
};

/** `itemRole="tab"` passes through — tablist root, `role="tab"` segments, `aria-selected` tracking. */
export const TabSemanticsPassThrough: Story = {
  render: () => (
    <SegmentedControl
      type="single"
      itemRole={ToggleItemRole.Tab}
      defaultValue="day"
      aria-label="View range"
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </SegmentedControl>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tablist', { name: 'View range' })).toBeInTheDocument();

    const tabs = canvas.getAllByRole('tab');
    await expect(tabs).toHaveLength(3);
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(tabs[2]!);
    await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  },
};
