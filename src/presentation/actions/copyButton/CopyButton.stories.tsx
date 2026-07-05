import type { Meta, StoryObj } from '@storybook/react';
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
