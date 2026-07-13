import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { cn, ElementTag } from '../../../foundation/utils';

/** Defines the gradient sweep direction (compass shorthand). */
export const GradientTextDirection = {
  /** Refers to a left-to-right sweep. */
  Right: 'r',
  /** Refers to a right-to-left sweep. */
  Left: 'l',
  /** Refers to a bottom-to-top sweep. */
  Top: 't',
  /** Refers to a top-to-bottom sweep. */
  Bottom: 'b',
  /** Refers to a bottom-left-to-top-right sweep. */
  TopRight: 'tr',
  /** Refers to a top-left-to-bottom-right sweep. */
  BottomRight: 'br',
  /** Refers to a top-right-to-bottom-left sweep. */
  TopLeft: 'tl',
  /** Refers to a bottom-right-to-top-left sweep. */
  BottomLeft: 'bl',
} as const;

export type GradientTextDirection =
  (typeof GradientTextDirection)[keyof typeof GradientTextDirection];

export interface GradientTextProps extends HTMLAttributes<HTMLElement> {
  from?: string;
  via?: string;
  to?: string;
  direction?: GradientTextDirection;
  isAnimated?: boolean;
  as?: ElementTag;
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
 * `isAnimated` pans the gradient on a 4s loop (skipped under
 * `prefers-reduced-motion` via the global `motion-reduce:` CSS guard).
 */
export const GradientText = forwardRef<HTMLElement, GradientTextProps>(
  function GradientText(
    {
      from = 'var(--color-primary)',
      via,
      to = 'var(--color-accent, var(--color-primary))',
      direction = 'r',
      isAnimated,
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
          isAnimated && 'motion-safe:animate-[gradient-shift_4s_ease-in-out_infinite]',
          className,
        )}
        style={{
          backgroundImage: `linear-gradient(${DIR_TO_DEG[direction]}deg, ${stops})`,
          backgroundSize: isAnimated ? '200% 100%' : undefined,
          ...style,
        }}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
