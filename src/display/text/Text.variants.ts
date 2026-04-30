import { tv, type VariantProps } from '../../utils';

export const textVariants = tv({
  base: '',
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    color: {
      default: 'text-neutral-900',
      muted: 'text-neutral-500',
      subtle: 'text-neutral-400',
      brand: 'text-brand-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
      danger: 'text-danger-600',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    truncate: {
      true: 'truncate',
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'normal',
    color: 'default',
  },
});

export type TextVariants = VariantProps<typeof textVariants>;
