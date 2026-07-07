import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn, surfaceVariants, type SurfaceTone } from '../../../foundation/utils';
import { Container, type ContainerProps } from '../container';
import { sectionVariants, type SectionPaddingY } from './Section.variants';

export interface SectionProps extends ComponentPropsWithoutRef<'section'> {
  /**
   * The tinted background tone for the band. Applies the shadow-less `subtle`
   * surface treatment (low-alpha tinted fill + `border-border`). Omit for a
   * transparent band (no fill, no border).
   */
  tone?: SurfaceTone;

  /** The max-width of the inner centered `Container`. Passthrough to `Container.size`. Default `lg`. */
  containerSize?: ContainerProps['size'];

  /** The vertical padding (the band's top/bottom rhythm). Default `md`. */
  py?: SectionPaddingY;

  /** The full-bleed mode — renders a `<section>` with no inner `Container` (edge-to-edge content). */
  bleed?: boolean;
  children?: ReactNode;
}

/**
 * Full-bleed `<section>` band with an inner centered `Container`. The repetitive
 * marketing "section band" pattern: optional tinted (shadow-less) background,
 * passthrough container width, and vertical padding. Pass `bleed` to drop the
 * inner Container for edge-to-edge content.
 */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { tone, containerSize, py, bleed = false, className, children, ...rest },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(
        sectionVariants({ py }),
        tone && surfaceVariants({ variant: 'subtle', tone, radius: 'none' }),
        className,
      )}
      {...rest}
    >
      {bleed ? children : <Container size={containerSize}>{children}</Container>}
    </section>
  );
});

Section.displayName = 'Section';
