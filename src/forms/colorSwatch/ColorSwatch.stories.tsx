import type { Meta, StoryObj } from '@storybook/react';
import { ColorSwatch } from './ColorSwatch';

const meta: Meta<typeof ColorSwatch> = {
  title: 'Forms/ColorSwatch',
  component: ColorSwatch,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ColorSwatch>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ColorSwatch color="#3b82f6" size="xs" />
      <ColorSwatch color="#3b82f6" size="sm" />
      <ColorSwatch color="#3b82f6" size="md" />
      <ColorSwatch color="#3b82f6" size="lg" />
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ColorSwatch color="#22c55e" shape="square" />
      <ColorSwatch color="#22c55e" shape="circle" />
    </div>
  ),
};

export const WithAlpha: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ColorSwatch color="#ef444480" />
      <ColorSwatch color="#ef4444" />
      <ColorSwatch color="rgba(239, 68, 68, 0.3)" />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ColorSwatch color="#f59e0b" onClick={() => alert('clicked')} aria-label="Amber" />
      <ColorSwatch color="#f59e0b" onClick={() => {}} selected aria-label="Selected" />
      <ColorSwatch color="#f59e0b" onClick={() => {}} disabled aria-label="Disabled" />
    </div>
  ),
};
