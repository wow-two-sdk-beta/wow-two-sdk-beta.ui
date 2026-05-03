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
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      subtle: 'text-subtle-foreground',
      brand: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      danger: 'text-destructive',
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
