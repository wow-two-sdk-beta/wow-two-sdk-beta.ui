import type { Meta, StoryObj } from '@storybook/react';
import { CellsGlyph, DotsGlyph, HorizontalBarsGlyph, VerticalBarsGlyph } from '@src/presentation/display/moduleGlyphs/ModuleGlyphs';

const meta: Meta = {
  title: 'Display/ModuleGlyphs',
};
export default meta;
type Story = StoryObj;

/* The module pattern glyphs — dots, bars, and the square-family cells. */
export const All: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <DotsGlyph size={28} />
      <VerticalBarsGlyph size={28} />
      <HorizontalBarsGlyph size={28} />
      <CellsGlyph cornerRx={0} size={28} />
      <CellsGlyph cornerRx={2.2} size={28} />
    </div>
  ),
};
