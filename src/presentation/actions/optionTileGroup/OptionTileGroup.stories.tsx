import type { Meta, StoryObj } from '@storybook/react';
import { Circle, Diamond, Square } from 'lucide-react';
import { Icon } from '../../../foundation/icons';
import { OptionTile } from '../optionTile';
import { OptionTileGroup } from './OptionTileGroup';

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
