import { tv, type VariantProps } from '../../utils';

/** Provides the vertical-rhythm (top/bottom padding) scale for the `Section` band. */
export const sectionVariants = tv({
  base: 'w-full',
  variants: {
    /* Vertical padding — the band's top/bottom breathing room. */
    py: {
      none: 'py-0',
      sm: 'py-6',
      md: 'py-10',
      lg: 'py-16',
      xl: 'py-24',
    },
  },
  defaultVariants: {
    py: 'md',
  },
});

export type SectionVariants = VariantProps<typeof sectionVariants>;

/** Represents the vertical-padding axis of the `Section` band (`none`–`xl`). */
export type SectionPaddingY = NonNullable<SectionVariants['py']>;
