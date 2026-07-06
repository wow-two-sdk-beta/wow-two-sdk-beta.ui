import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Square, Circle, Diamond } from 'lucide-react';
import { Icon } from '../../../foundation/icons';
import { OptionTile } from './OptionTile';

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
