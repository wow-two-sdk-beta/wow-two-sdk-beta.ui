import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { cn } from '../../utils';

export type GradientTextDirection = 'r' | 'l' | 't' | 'b' | 'tr' | 'br' | 'tl' | 'bl';
export type GradientTextTag = 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface GradientTextProps extends HTMLAttributes<HTMLElement> {
  from?: string;
  via?: string;
  to?: string;
  direction?: GradientTextDirection;
  animated?: boolean;
  as?: GradientTextTag;
}

const DIR_TO_DEG: Record<GradientTextDirection, number> = {
  r: 90,
  l: 270,
  t: 0,
  b: 180,
  tr: 45,
  br: 135,
  bl: 225,
  tl: 315,
};

/**
 * Decorative gradient-filled text via `background-clip: text`. Optional
 * `animated` pans the gradient on a 4s loop (skipped under
 * `prefers-reduced-motion` via the global `motion-reduce:` CSS guard).
 */
export const GradientText = forwardRef<HTMLElement, GradientTextProps>(
  function GradientText(
    {
      from = 'var(--color-primary)',
      via,
      to = 'var(--color-accent, var(--color-primary))',
      direction = 'r',
      animated,
      as = 'span',
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const stops = via ? `${from}, ${via}, ${to}` : `${from}, ${to}`;
    const Tag = as as ElementType;
    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          'inline-block bg-clip-text text-transparent',
          animated && 'motion-safe:animate-[gradient-shift_4s_ease-in-out_infinite]',
          className,
        )}
        style={{
          backgroundImage: `linear-gradient(${DIR_TO_DEG[direction]}deg, ${stops})`,
          backgroundSize: animated ? '200% 100%' : undefined,
          ...style,
        }}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
