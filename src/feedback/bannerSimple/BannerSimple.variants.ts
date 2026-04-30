import { tv, type VariantProps } from '../../utils';

export const bannerSimpleVariants = tv({
  base: 'w-full px-6 py-3 text-sm',
  variants: {
    severity: {
      info: 'bg-info-500 text-white',
      success: 'bg-success-500 text-white',
      warning: 'bg-warning-500 text-warning-900',
      danger: 'bg-danger-500 text-white',
      neutral: 'bg-neutral-900 text-neutral-50',
    },
  },
  defaultVariants: {
    severity: 'info',
  },
});

export type BannerSimpleVariants = VariantProps<typeof bannerSimpleVariants>;
