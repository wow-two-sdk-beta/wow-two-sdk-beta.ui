import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DisclosureButton } from './DisclosureButton';

const meta: Meta<typeof DisclosureButton> = {
  title: 'Actions/DisclosureButton',
  component: DisclosureButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DisclosureButton>;

export const Default: Story = {
  args: { children: 'Section title' },
  render: (args) => <div className="w-64"><DisclosureButton {...args} /></div>,
};

export const ChevronLeft: Story = {
  args: { children: 'Section title', chevronSide: 'left', defaultOpen: true },
  render: (args) => <div className="w-64"><DisclosureButton {...args} /></div>,
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: DisclosureButton.tsx behavior surface.
 * ------------------------------------------------------------------------- */

/** Click toggles `aria-expanded` + `data-state` and rotates the chevron; each change is reported. */
export const TogglesExpandedAndChevron: Story = {
  args: { children: 'Advanced settings', onOpenChange: fn() },
  render: (args) => <div className="w-64"><DisclosureButton {...args} /></div>,
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Advanced settings' });
    const chevron = () => button.querySelector('svg');

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('data-state', 'closed');
    await expect(chevron()).not.toBe(null);
    await expect(chevron()!.classList.contains('rotate-180')).toBe(false);

    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toHaveAttribute('data-state', 'open');
    await expect(chevron()!.classList.contains('rotate-180')).toBe(true);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('data-state', 'closed');
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(args.onOpenChange).toHaveBeenCalledTimes(2);
  },
};

/** Controlled — clicks report intent via `onOpenChange`, the DOM state follows `isOpen` only. */
export const ControlledOpenState: Story = {
  args: { children: 'Filters', isOpen: false, onOpenChange: fn() },
  render: (args) => <div className="w-64"><DisclosureButton {...args} /></div>,
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Filters' });

    await userEvent.click(button);
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    /* Parent didn't flip `isOpen` → stays closed. */
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('data-state', 'closed');
  },
};

/** Native `disabled` — refuses activation and exposes `data-disabled` for styling hooks. */
export const DisabledIsInert: Story = {
  args: { children: 'Locked section', disabled: true, onOpenChange: fn() },
  render: (args) => <div className="w-64"><DisclosureButton {...args} /></div>,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Locked section' });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('data-disabled');
  },
};
