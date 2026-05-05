import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * Button — Playground.
 *
 * Single controls-driven story exposing every prop. For at-a-glance visual
 * coverage across the variant×tone matrix, see `Actions/Button/Matrix`.
 * For curated real-world combinations, see `Actions/Button/Recipes`.
 */
const meta: Meta<typeof Button> = {
  title: 'Actions/Button/Playground',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outline', 'ghost', 'link', 'glass'],
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
    fullWidth: { control: 'boolean' },
    wrap: { control: 'boolean', description: 'false = single-line truncate; true = multi-line wrap' },
    loading: { control: 'boolean', description: 'Action-loading: spinner + aria-busy + click blocked' },
    skeleton: { control: 'boolean', description: 'Content-loading: shimmer + dimensions preserved' },
    loadingText: { control: 'text', description: 'Replaces children when loading' },
    disabled: { control: 'boolean' },
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
    fullWidth: false,
    wrap: false,
    loading: false,
    skeleton: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};
