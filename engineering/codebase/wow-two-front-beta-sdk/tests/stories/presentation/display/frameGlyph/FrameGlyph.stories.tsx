import type { Meta, StoryObj } from '@storybook/react';
import { FrameGlyph } from '@src/presentation/display/frameGlyph/FrameGlyph';

const meta: Meta<typeof FrameGlyph> = {
  title: 'Display/FrameGlyph',
  component: FrameGlyph,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FrameGlyph>;

/* Square / rounded / circle frames with their pupils, plus the dot-only variant. */
export const Frames: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <FrameGlyph frameRx={0} pupilRoundness={0} size={28} />
      <FrameGlyph frameRx={4} pupilRoundness={0.2} size={28} />
      <FrameGlyph frameRx={11} pupilRoundness={0.5} size={28} />
      <FrameGlyph frameRx={11} pupilRoundness={0.5} size={28} isDot />
    </div>
  ),
};
