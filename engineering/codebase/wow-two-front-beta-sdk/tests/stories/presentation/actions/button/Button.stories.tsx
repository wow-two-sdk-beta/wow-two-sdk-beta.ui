import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@src/presentation/actions/button/Button';

/* Button — controls-driven playground (every prop wired). */
const meta: Meta<typeof Button> = {
  title: 'Actions/Button/Playground',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'surface', 'outline', 'ghost', 'link', 'glass', 'glass-surface'],
      description: 'Visual treatment',
    },
    tone: {
      control: 'select',
      options: ['primary', 'neutral', 'danger', 'success', 'warning'],
      description: 'Semantic intent (mostly cosmetic for `glass`)',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    shape: {
      control: 'select',
      options: ['default', 'square', 'circle'],
    },
    isFullWidth: { control: 'boolean' },
    isMultiline: { control: 'boolean', description: 'false = single-line truncate; true = multi-line wrap' },
    isLoading: { control: 'boolean', description: 'Action-loading: spinner + aria-busy + click blocked' },
    isSkeleton: { control: 'boolean', description: 'Content-loading: shimmer + dimensions preserved' },
    loadingText: { control: 'text', description: 'Replaces children when loading' },
    isDisabled: { control: 'boolean' },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    asChild: { control: false, description: 'Render as child via Slot — playground does not render children swap' },
    children: { control: 'text' },
  },
  args: {
    children: 'Button',
    variant: 'solid',
    tone: 'primary',
    size: 'md',
    shape: 'default',
    isFullWidth: false,
    isMultiline: false,
    isLoading: false,
    isSkeleton: false,
    isDisabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Button.tsx behavior surface.
 * `asChild` substitution is covered by Recipes → AsChildLink.
 * ------------------------------------------------------------------------- */

/** Click fires `onClick`; the default `type` is `button` (not browser-default `submit`). */
export const ClickFiresOnClick: Story = {
  args: { children: 'Save', onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Save' });
    await expect(button).toHaveAttribute('type', 'button');

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Enter/Space activate via native button semantics — `onClick` fires from the keyboard. */
export const KeyboardActivates: Story = {
  args: { children: 'Confirm', onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Confirm' });
    button.focus();
    await expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** `isLoading` swaps children for spinner + `loadingText`, sets `aria-busy`, and swallows clicks (without native `disabled`). */
export const LoadingBlocksActivation: Story = {
  args: { children: 'Save changes', isLoading: true, loadingText: 'Saving…', onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    /* Busy semantics — perceivable + focusable, but announced busy (not native-disabled). */
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).not.toBeDisabled();
    await expect(button).toHaveAttribute('data-state', 'loading');

    /* `loadingText` replaces the children; the built-in spinner (aria-hidden svg) leads. */
    await expect(button).toHaveTextContent('Saving…');
    await expect(canvas.queryByText('Save changes')).toBe(null);
    await expect(button.querySelector('svg.animate-spin')).not.toBe(null);

    /* Activation is swallowed while loading. */
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** Loading without `loadingText` keeps the children as sr-only so the accessible name survives. */
export const LoadingKeepsAccessibleName: Story = {
  args: { children: 'Upload', isLoading: true },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Upload' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    /* The visible label is gone — only the spinner shows; the name lives in sr-only text. */
    await expect(button.querySelector('.sr-only')).toHaveTextContent('Upload');
  },
};

/** `isDisabled` forwards to native `disabled` — removed from focus order, refuses clicks. */
export const DisabledIsInert: Story = {
  args: { children: 'Delete', isDisabled: true, onClick: fn() },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Delete' });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('data-state', 'disabled');
  },
};
