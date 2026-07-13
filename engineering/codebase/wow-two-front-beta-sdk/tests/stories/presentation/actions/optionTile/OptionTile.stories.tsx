import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Square, Circle, Diamond } from 'lucide-react';
import { Icon } from '@src/foundation/icons';
import { OptionTile } from '@src/presentation/actions/optionTile/OptionTile';

const meta: Meta<typeof OptionTile> = {
  title: 'Actions/OptionTile',
  component: OptionTile,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof OptionTile>;

const SHAPES = [
  { id: 'square', label: 'Square', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'diamond', label: 'Diamond', icon: Diamond },
] as const;

/* Single-select grid — exactly one tile active at a time; the parent owns the value. */
function SelectableGrid() {
  const [active, setActive] = useState<string>('square');
  return (
    <div className="flex gap-2">
      {SHAPES.map((shape) => (
        <OptionTile
          key={shape.id}
          selected={active === shape.id}
          onSelect={() => setActive(shape.id)}
          label={shape.label}
        >
          <Icon icon={shape.icon} size={16} />
        </OptionTile>
      ))}
    </div>
  );
}

export const Grid: Story = { render: () => <SelectableGrid /> };

/* A disabled grid — wrap the tiles in a native `<fieldset disabled>`. */
export const Disabled: Story = {
  render: () => (
    <fieldset disabled className="m-0 flex gap-2 border-0 p-0">
      {SHAPES.map((shape) => (
        <OptionTile key={shape.id} selected={shape.id === 'square'} onSelect={() => {}} label={shape.label}>
          <Icon icon={shape.icon} size={16} />
        </OptionTile>
      ))}
    </fieldset>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: OptionTile.tsx behavior surface.
 * ------------------------------------------------------------------------- */

/** Single-select — clicking a tile moves the selection; re-clicking the active tile keeps it. */
export const SingleSelectMovesSelection: Story = {
  render: () => <SelectableGrid />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const square = canvas.getByRole('button', { name: 'Square' });
    const circle = canvas.getByRole('button', { name: 'Circle' });

    await expect(square).toHaveAttribute('aria-pressed', 'true');
    await expect(circle).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(circle);
    await expect(circle).toHaveAttribute('aria-pressed', 'true');
    await expect(square).toHaveAttribute('aria-pressed', 'false');

    /* Re-selecting the active tile is a harmless no-op — it stays selected. */
    await userEvent.click(circle);
    await expect(circle).toHaveAttribute('aria-pressed', 'true');
  },
};

/** `onSelect` fires on click AND keyboard activation; `aria-pressed` mirrors the `selected` prop only. */
export const SelectCallbackAndKeyboard: Story = {
  args: {
    selected: false,
    onSelect: fn(),
    label: 'Square',
    children: <Icon icon={Square} size={16} />,
  },
  play: async ({ canvasElement, args }) => {
    const tile = within(canvasElement).getByRole('button', { name: 'Square' });
    /* The label doubles as the native tooltip. */
    await expect(tile).toHaveAttribute('title', 'Square');

    await userEvent.click(tile);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);

    tile.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenCalledTimes(2);

    /* Controlled: the parent owns the value — un-updated `selected` stays unpressed. */
    await expect(tile).toHaveAttribute('aria-pressed', 'false');
  },
};

/** A disabled tile is inert — native `disabled`, out of the focus order. */
export const DisabledTileIsInert: Story = {
  args: {
    selected: false,
    onSelect: fn(),
    label: 'Diamond',
    isDisabled: true,
    children: <Icon icon={Diamond} size={16} />,
  },
  play: async ({ canvasElement }) => {
    const tile = within(canvasElement).getByRole('button', { name: 'Diamond' });
    await expect(tile).toBeDisabled();
  },
};
