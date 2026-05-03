import { tv, type VariantProps } from '../../utils';

export const bannerSimpleVariants = tv({
  base: 'w-full px-6 py-3 text-sm',
  variants: {
    severity: {
      info: 'bg-info text-info-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      danger: 'bg-destructive text-destructive-foreground',
      neutral: 'bg-inverse text-inverse-foreground',
    },
  },
  defaultVariants: {
    severity: 'info',
  },
});

export type BannerSimpleVariants = VariantProps<typeof bannerSimpleVariants>;
