/** Defines props for the radius glyph. */
export interface RadiusGlyphProps {
  /** The filled inner disc's radius as a fraction of the outer track (`0..1`). */
  readonly extent: number;

  /** The glyph's pixel size. */
  readonly size?: number;

  /** The stroke and fill color. */
  readonly color?: string;

  /** The outer track's stroke width. */
  readonly strokeWidth?: number;

  /** The outer track's opacity. */
  readonly trackOpacity?: number;
}

/** Renders a concentric-circle glyph whose filled inner disc scales with `extent` (`0..1`) — a compact radial-extent indicator. */
export function RadiusGlyph({
  extent,
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.5,
  trackOpacity = 0.4,
}: RadiusGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={strokeWidth} opacity={trackOpacity} />
      <circle cx="12" cy="12" r={Math.max(2, 10 * extent)} fill={color} />
    </svg>
  );
}
