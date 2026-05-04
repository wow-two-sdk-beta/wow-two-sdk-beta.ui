import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';

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
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            'shrink-0 motion-safe:animate-(--marquee-anim) motion-reduce:animation-none',
            horizontal ? 'flex shrink-0 items-center' : 'flex flex-col items-center',
            pauseOnHover && 'group-hover/marquee:[animation-play-state:paused]',
          )}
          style={{
            gap,
            paddingInline: horizontal ? gap / 2 : 0,
            paddingBlock: horizontal ? 0 : gap / 2,
            animation: `${animationName} ${speed}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
});
