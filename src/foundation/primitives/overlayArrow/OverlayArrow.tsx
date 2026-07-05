import { forwardRef, type SVGAttributes } from 'react';

export interface OverlayArrowProps extends SVGAttributes<SVGSVGElement> {
  /** Arrow width in px. Default 12. */
  width?: number;
  /** Arrow height in px. Default 6. */
  height?: number;
}

/**
 * Tip-arrow primitive for floating overlays (Tooltip, Popover, HoverCard).
 *
 * Renders a minimal SVG triangle with `fill="currentColor"` — color follows
 * the consuming overlay's background via Tailwind's `text-*` utilities.
 *
 * Pair with Floating UI's `arrow()` middleware to position. The middleware
 * exposes the arrow's `x` / `y` offset on the resolved data; consumers apply
 * those as inline styles to the wrapping span.
 */
export const OverlayArrow = forwardRef<SVGSVGElement, OverlayArrowProps>(
  function OverlayArrow({ width = 12, height = 6, fill = 'currentColor', ...rest }, ref) {
    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        {...rest}
      >
        <polygon points={`0,0 ${width},0 ${width / 2},${height}`} fill={fill} />
      </svg>
    );
  },
);
