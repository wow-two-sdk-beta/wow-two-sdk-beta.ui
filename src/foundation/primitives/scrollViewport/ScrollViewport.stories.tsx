import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ScrollViewport } from './ScrollViewport';

const meta: Meta<typeof ScrollViewport> = {
  title: 'Primitives/ScrollViewport',
  component: ScrollViewport,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ScrollViewport>;

const Rows = ({ count = 30 }: { count?: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <p key={i} className="px-3 py-1 text-sm">
        Row {i + 1}
      </p>
    ))}
  </>
);

export const FixedHeight: Story = {
  render: () => (
    <ScrollViewport height={160} className="w-64 rounded-md border border-border" data-testid="vp">
      <Rows />
    </ScrollViewport>
  ),
};

export const MaxHeight: Story = {
  render: () => (
    <ScrollViewport maxHeight={160} className="w-64 rounded-md border border-border">
      <Rows count={6} />
    </ScrollViewport>
  ),
};

export const Animated: Story = {
  render: () => (
    <ScrollViewport height="10rem" animate className="w-64 rounded-md border border-border">
      <Rows />
    </ScrollViewport>
  ),
};

/* ────────── Interaction test ────────── */

/** The viewport clamps to its fixed height, overflows (content taller than box), and reserves a stable scrollbar gutter. */
export const FixedHeightScrolls: Story = {
  render: () => (
    <ScrollViewport height={160} className="w-64 rounded-md border border-border" data-testid="vp">
      <Rows />
    </ScrollViewport>
  ),
  play: async ({ canvasElement }) => {
    const vp = within(canvasElement).getByTestId('vp');

    /* Fixed height honored (border-box total = 160) + content overflows it → scrollable, not grown. */
    await expect(vp.offsetHeight).toBe(160);
    await expect(vp.scrollHeight).toBeGreaterThan(vp.clientHeight);

    /* Stable gutter reserved so a toggling scrollbar never reflows content width. */
    await expect(getComputedStyle(vp).scrollbarGutter).toBe('stable');

    /* Ref-driven scroll works — the exposed node is the scrollable element. */
    vp.scrollTop = 40;
    await expect(vp.scrollTop).toBe(40);
  },
};
