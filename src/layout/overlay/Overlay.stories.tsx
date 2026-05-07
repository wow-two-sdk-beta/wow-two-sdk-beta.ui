import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Trash2, ZoomIn, Heart, Pencil } from 'lucide-react';
import { Button } from '../../actions/button';
import { Icon } from '../../icons';
import { Overlay } from './Overlay';

const meta: Meta<typeof Overlay> = {
  title: 'Layout/Overlay',
  component: Overlay,
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top', 'bottom', 'left', 'right', 'center'],
    },
    appearOn: {
      control: 'select',
      options: ['always', 'hover', 'focus-within'],
    },
    transition: {
      control: 'select',
      options: ['none', 'fade', 'fade-scale', 'fade-slide-up', 'fade-slide-down', 'fade-slide-left', 'fade-slide-right'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Overlay>;

const Frame = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative h-48 w-72 overflow-hidden rounded-md bg-muted group ${className}`}>
    <img src="https://placehold.co/288x192" alt="" className="h-full w-full object-cover" />
    {children}
  </div>
);

export const AlwaysVisible: Story = {
  render: () => (
    <Frame>
      <Overlay position="top-right">
        <Button variant="glass" shape="circle" size="sm" tone="neutral" aria-label="Delete">
          <Icon icon={Trash2} size={16} />
        </Button>
      </Overlay>
    </Frame>
  ),
};

export const HoverReveal: Story = {
  render: () => (
    <Frame>
      <Overlay position="center" appearOn="hover" transition="fade-scale">
        <Button variant="glass" shape="circle" size="md" tone="neutral" aria-label="Zoom">
          <Icon icon={ZoomIn} size={20} />
        </Button>
      </Overlay>
    </Frame>
  ),
};

export const FocusWithinReveal: Story = {
  render: () => (
    <div className="group relative inline-flex items-center gap-2 rounded-md border p-2 focus-within:ring-2">
      <input
        className="rounded-md border px-3 py-1 outline-none"
        placeholder="Focus me to reveal action"
      />
      <Overlay
        position={{ top: 4, right: 4 }}
        appearOn="focus-within"
        transition="fade-slide-left"
      >
        <Button variant="solid" tone="primary" size="sm">Submit</Button>
      </Overlay>
    </div>
  ),
};

export const HoverFadeSlideUp: Story = {
  render: () => (
    <Frame>
      <Overlay position="bottom" appearOn="hover" transition="fade-slide-up">
        <Button variant="glass" tone="neutral" size="sm">View details</Button>
      </Overlay>
    </Frame>
  ),
};

export const CustomInset: Story = {
  render: () => (
    <Frame>
      <Overlay position={{ top: 16, right: 24 }}>
        <Button variant="glass" shape="circle" size="sm" tone="neutral" aria-label="Favorite">
          <Icon icon={Heart} size={16} />
        </Button>
      </Overlay>
    </Frame>
  ),
};

const PresenceMountDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide overlay' : 'Show overlay'}
      </Button>
      <Frame>
        <Overlay
          isOpen={open}
          position="top-right"
          transition="fade-scale"
          transitionDuration={{ enter: 150, exit: 350 }}
        >
          <Button variant="glass" shape="circle" size="sm" tone="neutral" aria-label="Edit">
            <Icon icon={Pencil} size={16} />
          </Button>
        </Overlay>
      </Frame>
    </div>
  );
};

export const PresenceMount: Story = {
  render: () => <PresenceMountDemo />,
};

export const Center: Story = {
  render: () => (
    <Frame>
      <Overlay position="center">
        <Button variant="glass" tone="neutral" size="sm">Centered</Button>
      </Overlay>
    </Frame>
  ),
};

export const AsymmetricDurations: Story = {
  render: () => (
    <Frame>
      <Overlay
        position="top-right"
        appearOn="hover"
        transition="fade-scale"
        transitionDuration={{ enter: 100, exit: 500 }}
      >
        <Button variant="glass" shape="circle" size="sm" tone="neutral" aria-label="Quick in, slow out">
          <Icon icon={Heart} size={16} />
        </Button>
      </Overlay>
    </Frame>
  ),
};

export const NotSlotMode: Story = {
  render: () => (
    <Frame>
      <Overlay asChild={false} position="bottom-left" className="rounded bg-black/60 px-2 py-1 text-xs text-white">
        Live
      </Overlay>
    </Frame>
  ),
};
