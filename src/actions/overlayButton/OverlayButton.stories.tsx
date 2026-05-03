import type { Meta, StoryObj } from '@storybook/react';
import { Trash2, ZoomIn } from 'lucide-react';
import { Icon } from '../../icons';
import { OverlayButton } from './OverlayButton';

const meta: Meta<typeof OverlayButton> = {
  title: 'Actions/OverlayButton',
  component: OverlayButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof OverlayButton>;

export const OnImage: Story = {
  render: () => (
    <div className="relative h-48 w-72 overflow-hidden rounded-md bg-muted">
      <img
        src="https://placehold.co/288x192"
        alt=""
        className="h-full w-full object-cover"
      />
      <OverlayButton aria-label="Delete">
        <Icon icon={Trash2} size={16} />
      </OverlayButton>
    </div>
  ),
};

export const HoverReveal: Story = {
  render: () => (
    <div className="group relative h-48 w-72 overflow-hidden rounded-md bg-muted">
      <img
        src="https://placehold.co/288x192"
        alt=""
        className="h-full w-full object-cover"
      />
      <OverlayButton aria-label="Zoom" appearOn="hover" position="center" size="md">
        <Icon icon={ZoomIn} size={20} />
      </OverlayButton>
    </div>
  ),
};
