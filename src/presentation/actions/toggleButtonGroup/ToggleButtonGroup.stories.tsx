import type { Meta, StoryObj } from '@storybook/react';
import { ToggleButton } from '../toggleButton/ToggleButton';
import { ToggleButtonGroup } from './ToggleButtonGroup';

const meta: Meta<typeof ToggleButtonGroup> = {
  title: 'Actions/ToggleButtonGroup',
  component: ToggleButtonGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ToggleButtonGroup>;

export const Single: Story = {
  render: () => (
    <ToggleButtonGroup type="single" defaultValue="day">
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};

export const Multi: Story = {
  render: () => (
    <ToggleButtonGroup type="multi" defaultValue={['bold', 'italic']}>
      <ToggleButton value="bold">B</ToggleButton>
      <ToggleButton value="italic">I</ToggleButton>
      <ToggleButton value="underline">U</ToggleButton>
    </ToggleButtonGroup>
  ),
};

/**
 * Typed single-select — the `<View>` type param narrows `value` /
 * `onValueChange` to a string-literal union, so `v` is `View | null` at the
 * call site (no cast). Compile-time proof that the generic shape holds.
 */
type View = 'day' | 'week' | 'month';
export const Typed: Story = {
  render: () => (
    // Inline untyped `v` — mirrors the smart-qr call site. `v` is *inferred* as
    // `View | null` purely from the `<View>` type param; `satisfies` fails to
    // compile if inference ever regresses to `string | null`.
    <ToggleButtonGroup<View>
      type="single"
      defaultValue="week"
      onValueChange={(v) => {
        if (v) console.log(v satisfies View);
      }}
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};

/** iOS-style pill row on a muted track — supersedes the deprecated `SegmentedControl`. */
export const Segmented: Story = {
  render: () => (
    <ToggleButtonGroup variant="segmented" type="single" defaultValue="week">
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};
