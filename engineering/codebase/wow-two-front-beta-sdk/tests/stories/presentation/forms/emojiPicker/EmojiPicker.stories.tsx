import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { type EmojiCatalogEntry } from '@src/domain/emoji';
import { memoryStorageBroker } from '@src/foundation/storage';
import { EmojiPicker, type EmojiPickerProps } from '@src/presentation/forms/emojiPicker/EmojiPicker';
import { CategoryNavVariant, EmojiTileShape } from '@src/presentation/forms/emojiPicker/EmojiPicker.variants';

const meta: Meta<typeof EmojiPicker> = {
  title: 'Forms/EmojiPicker',
  component: EmojiPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmojiPicker>;

/** A controlled host — owns the entry value + a throwaway in-memory recents broker (each story is isolated). */
function ControlledPicker({
  onChange: spy,
  ...layout
}: Pick<EmojiPickerProps, 'categoryNavVariant' | 'size' | 'tileShape' | 'rowsCount'> & {
  onChange?: (value: EmojiCatalogEntry | null) => void;
}) {
  const [value, setValue] = useState<EmojiCatalogEntry | null>(null);
  const [broker] = useState(() => memoryStorageBroker());

  return (
    <div className="w-80 p-4">
      <EmojiPicker
        value={value}
        onChange={(next) => {
          setValue(next);
          spy?.(next);
        }}
        storage={broker}
        {...layout}
      />
      <p className="mt-3 text-sm text-muted-foreground">Value: {value?.glyph ?? '— (none)'}</p>
    </div>
  );
}

export const Default: Story = { render: () => <ControlledPicker /> };

export const PillsNav: Story = {
  render: () => <ControlledPicker categoryNavVariant={CategoryNavVariant.Pills} />,
};

export const CircleTiles: Story = {
  render: () => <ControlledPicker tileShape={EmojiTileShape.Circle} />,
};

export const PerElementSizes: Story = {
  render: () => <ControlledPicker size={{ search: 'sm', nav: 'md', tile: 'lg' }} rowsCount={5} />,
};

/* ────────── Interaction test (play function — runs as a browser test via the vitest addon) ────────── */

export const PickAndClear: Story = {
  args: { onChange: fn() },
  render: (args) => <ControlledPicker onChange={args.onChange as (value: EmojiCatalogEntry | null) => void} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // The recents bucket is empty on first mount — drive a deterministic pick through search instead.
    const search = canvas.getByPlaceholderText('Search emoji…');
    await userEvent.type(search, 'pizza');

    const pizza = await canvas.findByRole('option', { name: /pizza/i });
    await userEvent.click(pizza);

    // Picking emits the full catalog entry and marks the tile selected.
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ glyph: '🍕' }));
    await expect(pizza).toHaveAttribute('aria-selected', 'true');

    // "None" clears the selection back to null.
    await userEvent.click(canvas.getByRole('button', { name: 'None' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(null);
  },
};
