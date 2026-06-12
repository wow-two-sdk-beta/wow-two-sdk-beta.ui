import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useReducedMotion } from '../../hooks';

export type MarqueeDirection = 'left' | 'right' | 'up' | 'down';

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  direction?: MarqueeDirection;
  /** Seconds for one full traversal of the inner content. */
  speed?: number;
  pauseOnHover?: boolean;
  gap?: number;
  children: ReactNode;
}

/**
 * Continuously scrolls children. Content is duplicated once for a seamless
 * loop animated by `-50%`. Pause-on-hover toggles `animation-play-state`.
 */
export const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  { direction = 'left', speed = 30, pauseOnHover = true, gap = 48, className, children, ...rest },
  ref,
) {
  const horizontal = direction === 'left' || direction === 'right';
  const reverse = direction === 'right' || direction === 'down';
  const animationName = horizontal ? 'marquee-x' : 'marquee-y';
  const reducedMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      role="marquee"
      data-direction={direction}
      className={cn(
        'group/marquee relative overflow-hidden',
        horizontal ? 'flex' : 'flex flex-col',
        className,
      )}
      style={{ '--marquee-gap': `${gap}px` } as React.CSSProperties}
      {...rest}
    >
      {/* Single animated track holding both copies — each copy is exactly
          50% of the track, so the -50% keyframes loop seamlessly. */}
      <div
        className={cn(
          'flex shrink-0',
          horizontal ? 'items-center' : 'flex-col items-center',
          pauseOnHover && 'group-hover/marquee:[animation-play-state:paused]',
        )}
        style={{
          animation: reducedMotion
            ? undefined
            : `${animationName} ${speed}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            aria-hidden={i === 1}
            className={cn(
              'shrink-0',
              horizontal ? 'flex items-center' : 'flex flex-col items-center',
            )}
            style={{
              gap,
              paddingInline: horizontal ? gap / 2 : 0,
              paddingBlock: horizontal ? 0 : gap / 2,
            }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
});
