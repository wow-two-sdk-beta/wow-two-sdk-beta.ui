import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { CopyButton } from './CopyButton';

const meta: Meta<typeof CopyButton> = {
  title: 'Actions/CopyButton/Playground',
  component: CopyButton,
  tags: ['autodocs'],
  args: {
    text: 'hello world',
    'aria-label': 'Copy hello world',
    resetAfter: 2000,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'surface', 'outline', 'ghost', 'link', 'glass'],
    },
    tone: {
      control: 'select',
      options: ['primary', 'neutral', 'danger', 'success', 'warning'],
    },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['default', 'square', 'circle'] },
    resetAfter: { control: { type: 'number', min: 0, step: 250 } },
  },
};
export default meta;
type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {};

export const SquareIcon: Story = {
  args: { shape: 'square', variant: 'outline' },
};

export const RenderPropLabel: Story = {
  args: {
    text: 'hello world',
    'aria-label': 'Copy hello world',
    copiedAriaLabel: 'Copied to clipboard',
    variant: 'soft',
    children: ({ copied }: { copied: boolean }) => (copied ? 'Copied!' : 'Copy'),
  },
};

export const StickyCopied: Story = {
  args: { resetAfter: 0, 'aria-label': 'Copy and remember' },
};

export const WithErrorHandler: Story = {
  args: {
    'aria-label': 'Copy with error handler',
    onError: (error: Error) =>

      console.warn('[CopyButton] copy failed:', error),
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: CopyButton.tsx + useClipboard.
 * The headless harness grants no clipboard permission (`writeText` rejects),
 * so plays stub `navigator.clipboard.writeText` for a deterministic path in
 * BOTH the vitest run and the catalog — asserting the component's callback /
 * state, never real clipboard contents. Instance-level defineProperty shadows
 * the prototype getter; `restore` deletes the shadow.
 * ------------------------------------------------------------------------- */

function stubClipboard(impl: (text: string) => Promise<void>) {
  const writeText = fn(impl);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return {
    writeText,
    restore: () => {
      delete (navigator as { clipboard?: unknown }).clipboard;
    },
  };
}

/** Click hands `text` to the clipboard API, flips to the copied state (content + aria-label swap), and auto-reverts after `resetAfter`. */
export const CopyFlipsToCopiedAndReverts: Story = {
  args: {
    text: 'copy-me',
    'aria-label': 'Copy value',
    copiedAriaLabel: 'Copied',
    resetAfter: 600,
    children: ({ copied }: { copied: boolean }) => (copied ? 'Copied!' : 'Copy'),
    onError: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const clipboard = stubClipboard(async () => {});
    try {
      const canvas = within(canvasElement);
      const button = canvas.getByRole('button', { name: 'Copy value' });
      await expect(button).toHaveTextContent('Copy');
      await expect(button).not.toHaveAttribute('data-copied');

      await userEvent.click(button);
      await waitFor(() => expect(clipboard.writeText).toHaveBeenCalledWith('copy-me'));

      /* Copied state — data attr + render-prop content + copiedAriaLabel. */
      await waitFor(() => expect(button).toHaveAttribute('data-copied', 'true'));
      await expect(button).toHaveTextContent('Copied!');
      await expect(canvas.getByRole('button', { name: 'Copied' })).toBe(button);
      await expect(args.onError).not.toHaveBeenCalled();

      /* Auto-revert after the reset window. */
      await waitFor(() => expect(button).not.toHaveAttribute('data-copied'), { timeout: 3000 });
      await expect(button).toHaveTextContent('Copy');
      await expect(canvas.getByRole('button', { name: 'Copy value' })).toBe(button);
    } finally {
      clipboard.restore();
    }
  },
};

/** `resetAfter: 0` keeps the copied state sticky; default children swap the Copy icon for Check. */
export const StickyCopiedState: Story = {
  args: {
    text: 'sticky-id',
    'aria-label': 'Copy id',
    resetAfter: 0,
    onError: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const clipboard = stubClipboard(async () => {});
    try {
      const button = within(canvasElement).getByRole('button', { name: 'Copy id' });
      /* Default content is the icon-only Copy glyph. */
      await expect(button.querySelector('svg.lucide-copy')).not.toBe(null);

      await userEvent.click(button);
      await waitFor(() => expect(button).toHaveAttribute('data-copied', 'true'));
      await expect(button.querySelector('svg.lucide-check')).not.toBe(null);
      await expect(args.onError).not.toHaveBeenCalled();

      /* No reset timer is armed — the copied state persists after a settle window. */
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect(button).toHaveAttribute('data-copied', 'true');
    } finally {
      clipboard.restore();
    }
  },
};

/** Rejected `writeText` takes the fallback path — `onError` + render-prop `error`, never copied. */
export const RejectedCopyReportsError: Story = {
  args: {
    text: 'will-fail',
    'aria-label': 'Copy value',
    onError: fn(),
    children: ({ copied, error }: { copied: boolean; error: Error | null }) =>
      error ? 'Failed' : copied ? 'Copied!' : 'Copy',
  },
  play: async ({ canvasElement, args }) => {
    const clipboard = stubClipboard(async () => {
      throw new Error('clipboard denied');
    });
    try {
      const button = within(canvasElement).getByRole('button', { name: 'Copy value' });
      await userEvent.click(button);

      await waitFor(() => expect(args.onError).toHaveBeenCalledTimes(1));
      await expect(args.onError).toHaveBeenCalledWith(expect.any(Error));
      await expect(button).toHaveTextContent('Failed');
      await expect(button).not.toHaveAttribute('data-copied');
    } finally {
      clipboard.restore();
    }
  },
};
