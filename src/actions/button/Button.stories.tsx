import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/* Button — controls-driven playground (every prop wired). */
const meta: Meta<typeof Button> = {
  title: 'Actions/Button/Playground',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'surface', 'outline', 'ghost', 'link', 'glass'],
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
