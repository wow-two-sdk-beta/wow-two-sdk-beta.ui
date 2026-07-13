import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { type EmojiCatalogEntry } from '@src/domain/emoji';
import { memoryStorageBroker } from '@src/foundation/storage';
import { Button } from '@src/presentation/actions';
import { EmojiPickerPopover } from '@src/presentation/forms/emojiPicker/EmojiPickerPopover';

const meta: Meta<typeof EmojiPickerPopover> = {
  title: 'Forms/EmojiPickerPopover',
  component: EmojiPickerPopover,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmojiPickerPopover>;

/** A controlled host — owns the entry value + a throwaway in-memory recents broker (each story is isolated). */
function ControlledPopover({
  onChange: spy,
  placement,
  customTrigger,
}: {
  onChange?: (entry: EmojiCatalogEntry | null) => void;
  placement?: 'top' | 'bottom';
  customTrigger?: boolean;
}) {
  const [value, setValue] = useState<EmojiCatalogEntry | null>(null);
  const [broker] = useState(() => memoryStorageBroker());

  return (
    <div className="flex items-center gap-3 p-12">
      <EmojiPickerPopover
        value={value}
        onChange={(next) => {
          setValue(next);
          spy?.(next);
        }}
        storage={broker}
        placement={placement}
        trigger={customTrigger ? <Button>Add emoji {value?.glyph ?? ''}</Button> : undefined}
      />
      <span className="text-sm text-muted-foreground">picked: {value?.glyph ?? '— (none)'}</span>
    </div>
  );
}

export const Default: Story = { render: () => <ControlledPopover /> };

export const TopPlacement: Story = { render: () => <ControlledPopover placement="top" /> };

export const CustomTrigger: Story = { render: () => <ControlledPopover customTrigger /> };

/* ────────── Interaction test (play function — runs as a browser test via the vitest addon) ────────── */

export const PickClosesPopover: Story = {
  args: { onChange: fn() },
  render: (args) => <ControlledPopover onChange={args.onChange as (entry: EmojiCatalogEntry | null) => void} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // The picker portals to document.body — query it there, and poll the animation-deferred unmount.
    const body = within(canvasElement.ownerDocument.body);

    // The default trigger is an emoji-icon button labelled "Choose emoji".
    await userEvent.click(canvas.getByRole('button', { name: 'Choose emoji' }));

    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());

    // Drive a deterministic pick through search (recents is empty on first mount).
    await userEvent.type(await body.findByPlaceholderText('Search emoji…'), 'pizza');
    await userEvent.click(await body.findByRole('option', { name: /pizza/i }));

    // Picking emits the full catalog entry and closes the popover.
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ glyph: '🍕' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
