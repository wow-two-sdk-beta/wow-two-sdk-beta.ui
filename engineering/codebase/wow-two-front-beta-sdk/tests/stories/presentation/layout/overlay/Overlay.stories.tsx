import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Trash2, ZoomIn, Heart, Pencil } from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@src/presentation/actions/button';
import { Icon } from '@src/foundation/icons';
import { Overlay } from '@src/presentation/layout/overlay/Overlay';

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

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Overlay.tsx + Overlay.variants.ts.
 * Visibility gating is pure CSS (`group-hover` / `group-focus-within` /
 * presence `data-state`), so state is asserted through computed opacity
 * inside `waitFor` (transitions — harness gotcha). Real :hover cannot be
 * synthesized from `storybook/test` (documented limit), but BOTH hover and
 * focus-within modes reveal on `group-focus-within` by design (keyboard
 * parity), so the reveal is driven through real DOM focus. Presence mode
 * (isOpen) covers mount → data-state flip → exit-deferred unmount.
 * ------------------------------------------------------------------------- */

export const FocusWithinRevealsAndHides: Story = {
  render: () => (
    <div className="group relative h-32 w-72 overflow-hidden rounded-md bg-muted p-3">
      <input
        className="rounded-md border border-border px-3 py-1 text-sm outline-none"
        placeholder="Focus to reveal"
      />
      <Overlay
        position="bottom-right"
        appearOn="focus-within"
        transition="fade"
        transitionDuration={50}
      >
        <Button size="sm" tone="primary">Save</Button>
      </Overlay>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.getByRole('button', { name: 'Save' });

    // Hidden at rest — gated to opacity 0 while the group lacks focus.
    await expect(getComputedStyle(action).opacity).toBe('0');

    // Focus inside the group reveals it…
    await userEvent.click(canvas.getByPlaceholderText('Focus to reveal'));
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe('1'));

    // …and moving focus out of the group hides it again.
    await userEvent.click(canvasElement);
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe('0'));
  },
};

export const HoverModeRevealsViaKeyboardFocus: Story = {
  render: () => (
    <div className="group relative h-32 w-72 overflow-hidden rounded-md bg-muted">
      <Overlay
        position="center"
        appearOn="hover"
        transition="fade-scale"
        transitionDuration={50}
      >
        <Button size="sm" tone="neutral" aria-label="Zoom">
          <Icon icon={ZoomIn} size={16} />
        </Button>
      </Overlay>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.getByRole('button', { name: 'Zoom' });

    await expect(getComputedStyle(action).opacity).toBe('0');

    // Hover mode also reveals on group-focus-within (keyboard parity in the
    // variants) — tab onto the overlay's own action to reveal it.
    await userEvent.tab();
    await expect(action).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe('1'));

    // Tabbing away drops group focus → fades back out.
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe('0'));
  },
};

const PresenceLifecycleDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen((v) => !v)}>Toggle overlay</Button>
      <div className="relative h-32 w-72 overflow-hidden rounded-md bg-muted">
        <Overlay
          isOpen={open}
          position="top-right"
          transition="fade"
          transitionDuration={{ enter: 50, exit: 120 }}
        >
          <Button size="sm" tone="neutral" aria-label="Edit">
            <Icon icon={Pencil} size={16} />
          </Button>
        </Overlay>
      </div>
    </div>
  );
};

export const PresenceMountsAndDefersUnmount: Story = {
  render: () => <PresenceLifecycleDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Presence mode: closed = fully unmounted.
    await expect(canvas.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();

    // Opening mounts it and flips data-state to open on the next frame.
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle overlay' }));
    const action = await canvas.findByRole('button', { name: 'Edit' });
    await waitFor(() => expect(action).toHaveAttribute('data-state', 'open'));
    await waitFor(() => expect(getComputedStyle(action).opacity).toBe('1'));

    // Closing flips to data-state=closed first (exit transition), THEN unmounts.
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle overlay' }));
    await waitFor(() => expect(action).toHaveAttribute('data-state', 'closed'));
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument(),
    );
  },
};

export const CustomInsetPositionsFromRawOffsets: Story = {
  render: () => (
    <div className="relative h-32 w-72 overflow-hidden rounded-md bg-muted">
      <Overlay position={{ top: 4, right: 8 }}>
        <span data-testid="badge" className="rounded bg-black/60 px-2 py-1 text-xs text-white">
          Live
        </span>
      </Overlay>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByTestId('badge');

    // Raw inset object → per-side inline offsets (numbers coerce to px) + default z-index.
    await expect(badge).toHaveStyle({ position: 'absolute', top: '4px', right: '8px' });
    await expect(getComputedStyle(badge).zIndex).toBe('10');
  },
};
