import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ScrollArea } from '@src/presentation/layout/scrollArea/ScrollArea';

const meta: Meta<typeof ScrollArea> = {
  title: 'Layout/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-40 w-64 rounded-md border border-neutral-200 p-4">
      {Array.from({ length: 30 }, (_, i) => (
        <p key={i}>Line {i + 1}</p>
      ))}
    </ScrollArea>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: ScrollArea.tsx source.
 * This atom is a NATIVE overflow container (no custom scrollbar thumb — that
 * is deferred to the L5 organism), so the assertable surface is the scroll
 * box itself: per-axis overflow clipping and a live scroll position. Real
 * wheel gestures can't be synthesized from `storybook/test` (documented
 * harness limit) and the div isn't focusable for keyboard scrolling, so the
 * scroll is driven through the DOM scroll API, mirroring ScrollViewport's
 * `FixedHeightScrolls` pattern.
 * ------------------------------------------------------------------------- */

export const VerticalAxisScrollsAndClipsX: Story = {
  render: () => (
    <ScrollArea data-testid="scroll-area" className="h-40 w-64 rounded-md border border-border p-4">
      {Array.from({ length: 40 }, (_, i) => (
        <p key={i} className="whitespace-nowrap text-sm">
          Vertical line {i + 1} — deliberately wider than the 16rem box so the x-axis has overflow to clip
        </p>
      ))}
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByTestId('scroll-area');

    // Content overflows the fixed box on both axes…
    await expect(area.scrollHeight).toBeGreaterThan(area.clientHeight);
    await expect(area.scrollWidth).toBeGreaterThan(area.clientWidth);

    // …but only the y-axis is a scroll axis; x is clipped.
    await expect(getComputedStyle(area).overflowY).toBe('auto');
    await expect(getComputedStyle(area).overflowX).toBe('hidden');

    // The node is a live scroll container — position moves and clamps at the end.
    area.scrollTop = 120;
    await expect(area.scrollTop).toBe(120);
    area.scrollTop = 1_000_000;
    await expect(area.scrollTop).toBe(area.scrollHeight - area.clientHeight);
  },
};

export const HorizontalAxisScrollsAndClipsY: Story = {
  args: { axis: 'horizontal' },
  render: (args) => (
    <ScrollArea {...args} data-testid="scroll-area" className="h-24 w-64 rounded-md border border-border p-4">
      <div className="flex w-[60rem] gap-2">
        {Array.from({ length: 24 }, (_, i) => (
          <span key={i} className="shrink-0 rounded bg-muted px-2 py-1 text-sm">
            Col {i + 1}
          </span>
        ))}
      </div>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByTestId('scroll-area');

    await expect(area.scrollWidth).toBeGreaterThan(area.clientWidth);
    await expect(getComputedStyle(area).overflowX).toBe('auto');
    await expect(getComputedStyle(area).overflowY).toBe('hidden');

    area.scrollLeft = 200;
    await expect(area.scrollLeft).toBe(200);
  },
};

export const BothAxesScroll: Story = {
  args: { axis: 'both' },
  render: (args) => (
    <ScrollArea {...args} data-testid="scroll-area" className="h-40 w-64 rounded-md border border-border p-4">
      <div className="w-[40rem]">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="whitespace-nowrap text-sm">
            Grid row {i + 1} — wide enough to overflow the x-axis too
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const area = within(canvasElement).getByTestId('scroll-area');

    await expect(getComputedStyle(area).overflowX).toBe('auto');
    await expect(getComputedStyle(area).overflowY).toBe('auto');

    area.scrollTop = 80;
    area.scrollLeft = 60;
    await expect(area.scrollTop).toBe(80);
    await expect(area.scrollLeft).toBe(60);
  },
};
