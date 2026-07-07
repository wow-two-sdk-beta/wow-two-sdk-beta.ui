import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { cn } from '../../utils';
import { useReducedMotion } from '../../hooks';

export interface ScrollViewportProps extends ComponentPropsWithoutRef<'div'> {
  /**
   * The fixed viewport height. Number → pixels; string → any CSS length
   * (`'20rem'`, `'50vh'`). Content beyond this scrolls; the box does not grow.
   * Omit to let the container size to its context (still clips + scrolls via `maxHeight`).
   */
  height?: number | string;

  /**
   * The height ceiling — grows with content up to this cap without pinning it,
   * then scrolls. Number → pixels; string → any CSS length.
   */
  maxHeight?: number | string;

  /**
   * The height/opacity transition flag (a content swap, an expand). Respects
   * `prefers-reduced-motion` — the transition is dropped when the user opts out.
   * @default false
   */
  animate?: boolean;
}

/**
 * Headless fixed-height scroll container. A drop-in for inline
 * `h-[…] overflow-y-auto` viewport styling with two stability guarantees:
 *
 * - `scrollbar-gutter: stable` — reserves the scrollbar's track so content
 *   doesn't shift horizontally when the bar appears/disappears (an overflow-y
 *   toggle that would otherwise reflow the row).
 * - optional height/opacity transition (`animate`) that short-circuits under
 *   `prefers-reduced-motion`, so motion-sensitive users get an instant swap.
 *
 * No visual styling beyond layout — border/padding/rounding stay with the
 * consumer. `forwardRef` exposes the scrollable node so callers can drive
 * `scrollTop` (scroll-to-top on filter, virtualization measurements, etc.).
 */
export const ScrollViewport = forwardRef<HTMLDivElement, ScrollViewportProps>(
  ({ height, maxHeight, animate = false, className, style, ...props }, ref) => {
    const reducedMotion = useReducedMotion();
    const transitionsOn = animate && !reducedMotion;

    const sizeStyle: CSSProperties = {
      height,
      maxHeight,
      // `stable` reserves the gutter on the block-end/inline-end edge so a
      // toggling vertical scrollbar never reflows the content width.
      scrollbarGutter: 'stable',
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-y-auto overflow-x-hidden',
          transitionsOn && 'transition-[height,opacity] duration-200 ease-out',
          className,
        )}
        style={sizeStyle}
        {...props}
      />
    );
  },
);
ScrollViewport.displayName = 'ScrollViewport';
