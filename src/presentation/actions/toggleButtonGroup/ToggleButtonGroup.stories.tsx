import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LayoutGrid, List, Image as ImageIcon, Smile } from 'lucide-react';
import { ToggleButton } from '../toggleButton/ToggleButton';
import { ToggleButtonGroup } from './ToggleButtonGroup';
import { ToggleButtonGroupVariant, ToggleItemRole, ToggleMode } from './ToggleButtonGroup.variants';

const meta: Meta<typeof ToggleButtonGroup> = {
  title: 'Actions/ToggleButtonGroup',
  component: ToggleButtonGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ToggleButtonGroup>;

export const Single: Story = {
  render: () => (
    <ToggleButtonGroup type={ToggleMode.Single} defaultValue="day">
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};

export const Multi: Story = {
  render: () => (
    <ToggleButtonGroup type={ToggleMode.Multi} defaultValue={['bold', 'italic']}>
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
      type={ToggleMode.Single}
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
    <ToggleButtonGroup
      variant={ToggleButtonGroupVariant.Segmented}
      type={ToggleMode.Single}
      defaultValue="week"
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};

/** Individually-separated rounded pills — detached chips, distinct from the connected `segmented` track. */
export const Pill: Story = {
  render: () => (
    <ToggleButtonGroup
      variant={ToggleButtonGroupVariant.Pill}
      type={ToggleMode.Single}
      defaultValue="week"
    >
      <ToggleButton value="day" variant="soft">
        Day
      </ToggleButton>
      <ToggleButton value="week" variant="soft">
        Week
      </ToggleButton>
      <ToggleButton value="month" variant="soft">
        Month
      </ToggleButton>
    </ToggleButtonGroup>
  ),
};

/** Equal-width icon tiles filling a fixed-width strip — a category nav row. */
export const EqualWidthTiles: Story = {
  render: () => (
    <ToggleButtonGroup
      type={ToggleMode.Single}
      itemRole={ToggleItemRole.Tab}
      equalWidth
      defaultValue="grid"
      className="w-72"
    >
      <ToggleButton value="grid" aria-label="Grid">
        <LayoutGrid className="size-4" />
      </ToggleButton>
      <ToggleButton value="list" aria-label="List">
        <List className="size-4" />
      </ToggleButton>
      <ToggleButton value="images" aria-label="Images">
        <ImageIcon className="size-4" />
      </ToggleButton>
      <ToggleButton value="emoji" aria-label="Emoji">
        <Smile className="size-4" />
      </ToggleButton>
    </ToggleButtonGroup>
  ),
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/** Single-select tab semantics — tablist role, `role="tab"` items, and `aria-selected` tracking the active tab. */
export const TabSemantics: Story = {
  render: () => (
    <ToggleButtonGroup
      type={ToggleMode.Single}
      itemRole={ToggleItemRole.Tab}
      defaultValue="day"
      aria-label="View range"
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Root is a tablist; items are tabs. */
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    const tabs = canvas.getAllByRole('tab');
    await expect(tabs).toHaveLength(3);

    /* Default active tab is selected; others are not. */
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    /* Selecting another tab moves the selection (single-select — only one active). */
    await userEvent.click(tabs[1]!);
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  },
};

/** Equal-width tiles — every item shares the row width (equal client widths within a fixed container). */
export const EqualWidthLayout: Story = {
  render: () => (
    <ToggleButtonGroup
      type={ToggleMode.Single}
      equalWidth
      defaultValue="grid"
      className="w-72"
      aria-label="Category"
    >
      <ToggleButton value="grid" aria-label="Grid">
        <LayoutGrid className="size-4" />
      </ToggleButton>
      <ToggleButton value="list" aria-label="A much longer list label">
        <List className="size-4" />
      </ToggleButton>
      <ToggleButton value="images" aria-label="Images">
        <ImageIcon className="size-4" />
      </ToggleButton>
    </ToggleButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons).toHaveLength(3);

    /* Despite differing label lengths, equal-width tiles render at the same width. */
    const widths = buttons.map((b) => Math.round(b.getBoundingClientRect().width));
    await expect(widths[0]).toBe(widths[1]);
    await expect(widths[1]).toBe(widths[2]);
    await expect(widths[0]).toBeGreaterThan(0);
  },
};

/** Pill variant — detached rounded chips (fully-rounded, gap-separated, not attached). */
export const PillVariant: Story = {
  render: () => (
    <ToggleButtonGroup
      variant={ToggleButtonGroupVariant.Pill}
      type={ToggleMode.Single}
      defaultValue="week"
      aria-label="Range"
    >
      <ToggleButton value="day" variant="soft">
        Day
      </ToggleButton>
      <ToggleButton value="week" variant="soft">
        Week
      </ToggleButton>
      <ToggleButton value="month" variant="soft">
        Month
      </ToggleButton>
    </ToggleButtonGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');
    const buttons = canvas.getAllByRole('button');

    /* Pills are fully rounded (rounded-full → a large border radius). */
    const radius = parseFloat(getComputedStyle(buttons[0]!).borderTopLeftRadius);
    await expect(radius).toBeGreaterThan(100);

    /* Detached — the group uses a positive gap rather than negative-margin attachment. */
    const gap = parseFloat(getComputedStyle(group).columnGap || getComputedStyle(group).gap || '0');
    await expect(gap).toBeGreaterThan(0);

    /* Selection still works. */
    await userEvent.click(buttons[0]!);
    await expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Single mode is exclusive — at most one pressed; re-clicking the active item clears to `null`. */
export const SingleModeIsExclusive: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <ToggleButtonGroup
      type={ToggleMode.Single}
      defaultValue="day"
      onValueChange={args.onValueChange as (value: string | null) => void}
      aria-label="View range"
    >
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const day = canvas.getByRole('button', { name: 'Day' });
    const week = canvas.getByRole('button', { name: 'Week' });
    const month = canvas.getByRole('button', { name: 'Month' });

    await expect(day).toHaveAttribute('aria-pressed', 'true');

    /* Selecting another item moves the selection — never two pressed. */
    await userEvent.click(week);
    await expect(week).toHaveAttribute('aria-pressed', 'true');
    await expect(day).toHaveAttribute('aria-pressed', 'false');
    await expect(month).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('week');

    /* Re-clicking the active item clears the selection (single-select allows empty). */
    await userEvent.click(week);
    await expect(week).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
  },
};

/** Multi mode toggles items independently — selections accumulate and remove one-by-one. */
export const MultiModeTogglesIndependently: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <ToggleButtonGroup
      type={ToggleMode.Multi}
      defaultValue={['bold']}
      onValueChange={args.onValueChange as (value: ReadonlyArray<string>) => void}
      aria-label="Formatting"
    >
      <ToggleButton value="bold">Bold</ToggleButton>
      <ToggleButton value="italic">Italic</ToggleButton>
      <ToggleButton value="underline">Underline</ToggleButton>
    </ToggleButtonGroup>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole('button', { name: 'Bold' });
    const italic = canvas.getByRole('button', { name: 'Italic' });

    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'false');

    /* Adding keeps existing selections — both active. */
    await userEvent.click(italic);
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['bold', 'italic']);

    /* Unpressing removes only that item. */
    await userEvent.click(bold);
    await expect(bold).toHaveAttribute('aria-pressed', 'false');
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['italic']);
  },
};
