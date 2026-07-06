/** Defines props for a frame glyph. */
export interface FrameGlyphProps {
  /** The outer frame's corner radius (`0` = square). */
  readonly frameRx: number;

  /** The pupil's roundness as a fraction of its size (`0` = square, `0.5` = circle). */
  readonly pupilRoundness: number;

  /** Render only the enlarged inner pupil instead of the full frame + pupil. */
  readonly isDot?: boolean;

  /** The glyph's pixel size. */
  readonly size?: number;
}

/** Renders a nested-frame glyph — an outer frame + inner pupil, or (with `isDot`) just the enlarged pupil; a scanner / viewfinder / QR-eye indicator. */
export function FrameGlyph({ frameRx, pupilRoundness, isDot, size = 20 }: FrameGlyphProps) {
  const pupilSize = isDot ? 12 : 8;
  const pupilOffset = isDot ? 6 : 8;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {!isDot && (
        <rect x={2} y={2} width={20} height={20} rx={frameRx} fill="none" stroke="currentColor" strokeWidth={2.5} />
      )}
      <rect
        x={pupilOffset}
        y={pupilOffset}
        width={pupilSize}
        height={pupilSize}
        rx={pupilSize * pupilRoundness}
        fill="currentColor"
      />
    </svg>
  );
}
