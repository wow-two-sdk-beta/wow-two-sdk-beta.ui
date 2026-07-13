import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Circle, Diamond, Square } from 'lucide-react';
import { Icon } from '@src/foundation/icons';
import { OptionTile } from '@src/presentation/actions/optionTile';
import { OptionTileGroup } from '@src/presentation/actions/optionTileGroup/OptionTileGroup';

const meta: Meta<typeof OptionTileGroup> = {
  title: 'Actions/OptionTileGroup',
  component: OptionTileGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof OptionTileGroup>;

const SHAPES = [
  { id: 'square', label: 'Square', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'diamond', label: 'Diamond', icon: Diamond },
] as const;

/* A labelled row of tiles — one active. */
export const Default: Story = {
  render: () => (
    <OptionTileGroup label="Shape">
      {SHAPES.map((shape) => (
        <OptionTile key={shape.id} selected={shape.id === 'square'} onSelect={() => {}} label={shape.label}>
          <Icon icon={shape.icon} size={16} />
        </OptionTile>
      ))}
    </OptionTileGroup>
  ),
};

/* `disabled` greys + blocks the whole group. */
export const Disabled: Story = {
  render: () => (
    <OptionTileGroup label="Shape" disabled>
      {SHAPES.map((shape) => (
        <OptionTile key={shape.id} selected={shape.id === 'square'} onSelect={() => {}} label={shape.label}>
          <Icon icon={shape.icon} size={16} />
        </OptionTile>
      ))}
    </OptionTileGroup>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: OptionTileGroup.tsx behavior surface.
 * ------------------------------------------------------------------------- */

/* Stateful fixture — the group is layout+semantics; the parent owns the single-select value. */
function SelectableGroupFixture() {
  const [active, setActive] = useState<string>('square');
  return (
    <OptionTileGroup label="Shape">
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
    </OptionTileGroup>
  );
}

/** The fieldset exposes the group name; selection moves across the labelled tiles. */
export const LabelledGroupSelectsTiles: Story = {
  render: () => <SelectableGroupFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    /* Native fieldset → role=group, named via aria-label. */
    const group = canvas.getByRole('group', { name: 'Shape' });
    await expect(group.tagName).toBe('FIELDSET');

    const square = canvas.getByRole('button', { name: 'Square' });
    const diamond = canvas.getByRole('button', { name: 'Diamond' });
    await expect(square).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(diamond);
    await expect(diamond).toHaveAttribute('aria-pressed', 'true');
    await expect(square).toHaveAttribute('aria-pressed', 'false');
  },
};

/** Group `disabled` natively disables every tile — the whole grid is inert at once. */
export const DisabledGroupBlocksAllTiles: Story = {
  render: () => (
    <OptionTileGroup label="Shape" disabled>
      {SHAPES.map((shape) => (
        <OptionTile key={shape.id} selected={shape.id === 'square'} onSelect={() => {}} label={shape.label}>
          <Icon icon={shape.icon} size={16} />
        </OptionTile>
      ))}
    </OptionTileGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Shape' })).toBeDisabled();

    const tiles = canvas.getAllByRole('button');
    await expect(tiles).toHaveLength(3);
    for (const tile of tiles) {
      await expect(tile).toBeDisabled();
    }
  },
};
