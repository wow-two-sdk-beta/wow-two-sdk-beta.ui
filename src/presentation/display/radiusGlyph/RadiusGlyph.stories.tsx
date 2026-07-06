import type { Meta, StoryObj } from '@storybook/react';
import { RadiusGlyph } from './RadiusGlyph';

const meta: Meta<typeof RadiusGlyph> = {
  title: 'Display/RadiusGlyph',
  component: RadiusGlyph,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RadiusGlyph>;

/* The filled inner disc grows with `extent` (0..1). */
export const Extents: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {[0.2, 0.4, 0.6, 0.8, 1].map((extent) => (
        <RadiusGlyph key={extent} extent={extent} size={24} />
      ))}
    </div>
  ),
};
