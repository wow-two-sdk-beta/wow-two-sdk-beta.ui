import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type Ref,
} from 'react';
import { cn } from '../../utils';

type EyebrowLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface EyebrowProps extends ComponentPropsWithoutRef<'h2'> {
  /** Semantic heading level (1–6). Default 3. */
  level?: EyebrowLevel;
  /** Color tone. Default `muted`. */
  tone?: 'muted' | 'subtle' | 'default';
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
