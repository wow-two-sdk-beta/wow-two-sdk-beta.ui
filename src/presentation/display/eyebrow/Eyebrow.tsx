import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type Ref,
} from 'react';
import { cn } from '../../../foundation/utils';

type EyebrowLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Defines the Eyebrow color tone. */
export const EyebrowTone = {
  /** Refers to the muted foreground. */
  Muted: 'muted',
  /** Refers to the subtle foreground. */
  Subtle: 'subtle',
  /** Refers to the default foreground. */
  Default: 'default',
} as const;

export type EyebrowTone = (typeof EyebrowTone)[keyof typeof EyebrowTone];

export interface EyebrowProps extends ComponentPropsWithoutRef<'h2'> {
  /** The semantic heading level (1–6). Default 3. */
  level?: EyebrowLevel;

  /** The color tone. Default `muted`. */
  tone?: EyebrowTone;
}

const TONE: Record<NonNullable<EyebrowProps['tone']>, string> = {
  muted: 'text-muted-foreground',
  subtle: 'text-subtle-foreground',
  default: 'text-foreground',
};

/**
 * Tiny uppercase mini-heading — used above sections in drawers/cards
 * ("FULL TEXT", "SEGMENTS"). Lighter than `SectionHeader` (which is a
 * chunkier title+description+actions component). Standardised uppercase +
 * tracking treatment.
 */
export const Eyebrow = forwardRef<HTMLHeadingElement, EyebrowProps>(
  ({ level = 3, tone = 'muted', className, ...props }, ref) => {
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return (
      <Tag
        ref={ref as Ref<HTMLHeadingElement>}
        className={cn(
          'text-[10px] font-semibold uppercase tracking-wider',
          TONE[tone],
          className,
        )}
        {...props}
      />
    );
  },
);
Eyebrow.displayName = 'Eyebrow';
