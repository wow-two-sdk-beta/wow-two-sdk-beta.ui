import type { Meta, StoryObj } from '@storybook/react';
import { Eyebrow } from './Eyebrow';

const meta: Meta<typeof Eyebrow> = {
  title: 'Display/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Eyebrow>;

export const Default: Story = { args: { children: 'Full text' } };

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Eyebrow tone="muted">Muted — full text</Eyebrow>
      <Eyebrow tone="subtle">Subtle — segments</Eyebrow>
      <Eyebrow tone="default">Default — metadata</Eyebrow>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1">
      <Eyebrow>Segments</Eyebrow>
      <p className="text-sm text-foreground">12 segments captured — 1.4s total runtime.</p>
    </div>
  ),
};
