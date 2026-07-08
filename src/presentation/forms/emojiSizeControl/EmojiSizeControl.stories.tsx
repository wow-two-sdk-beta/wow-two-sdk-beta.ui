import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { EmojiSizeControl } from './EmojiSizeControl';
import { DefaultEmojiSize } from './EmojiSizeControl.variants';

const meta: Meta<typeof EmojiSizeControl> = {
  title: 'Forms/EmojiSizeControl',
  component: EmojiSizeControl,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmojiSizeControl>;

/** A controlled host — owns the size ratio; the tiles preview the chosen glyph at each preset. */
function ControlledSize({ glyph = '🍕', size }: { glyph?: string; size?: 'sm' | 'md' | 'lg' }) {
  const [ratio, setRatio] = useState(DefaultEmojiSize);
  return (
    <div className="w-64 p-4">
      <EmojiSizeControl glyph={glyph} sizeRatio={ratio} onChange={setRatio} size={size} />
      <p className="mt-3 text-sm text-muted-foreground">ratio: {ratio}</p>
    </div>
  );
}

export const Default: Story = { render: () => <ControlledSize /> };

export const CustomGlyph: Story = { render: () => <ControlledSize glyph="🚀" /> };

export const LargeTiles: Story = { render: () => <ControlledSize size="lg" /> };

/* ────────── Interaction test (play function — runs as a browser test via the vitest addon) ────────── */

export const PickSize: Story = {
  render: () => <ControlledSize />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The default ratio (0.25) leaves the Medium tile pressed; picking Large moves the selection.
    const large = canvas.getByLabelText('Size: Large');
    await userEvent.click(large);
    await expect(large).toHaveAttribute('aria-pressed', 'true');

    const medium = canvas.getByLabelText('Size: Medium');
    await expect(medium).toHaveAttribute('aria-pressed', 'false');
  },
};
