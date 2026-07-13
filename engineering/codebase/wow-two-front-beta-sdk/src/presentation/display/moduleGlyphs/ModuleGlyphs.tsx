// Three-cell preview geometry — cells at these x-positions, each this wide, on a 24-unit canvas.
const CELL_POSITIONS = [3, 9.5, 16];
const CELL_SIZE = 5;
const BAR_CORNER_RX = 2.4;

/** Defines props for a fixed-geometry glyph. */
export interface GlyphProps {
  /** The glyph's pixel size. */
  readonly size?: number;
}

/** Renders a three-dot glyph. */
export function DotsGlyph({ size = 20 }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {CELL_POSITIONS.map((x) => (
        <circle key={x} cx={x + CELL_SIZE / 2} cy={12} r={2.5} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Renders a three-vertical-bar glyph. */
export function VerticalBarsGlyph({ size = 20 }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {CELL_POSITIONS.map((x) => (
        <rect key={x} x={x} y={4} width={CELL_SIZE} height={16} rx={BAR_CORNER_RX} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Renders a three-horizontal-bar glyph. */
export function HorizontalBarsGlyph({ size = 20 }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {CELL_POSITIONS.map((y) => (
        <rect key={y} x={4} y={y} width={16} height={CELL_SIZE} rx={BAR_CORNER_RX} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Defines props for the cells glyph. */
export interface CellsGlyphProps extends GlyphProps {
  /** The cells' corner radius. */
  readonly cornerRx: number;
}

/** Renders a three-cell glyph with the given corner radius. */
export function CellsGlyph({ cornerRx, size = 20 }: CellsGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {CELL_POSITIONS.map((x) => (
        <rect key={x} x={x} y={9.5} width={CELL_SIZE} height={CELL_SIZE} rx={cornerRx} fill="currentColor" />
      ))}
    </svg>
  );
}
