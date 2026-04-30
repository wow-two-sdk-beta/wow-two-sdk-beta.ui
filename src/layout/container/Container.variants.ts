import { tv, type VariantProps } from '../../utils';

export const containerVariants = tv({
  base: 'mx-auto w-full px-4',
  variants: {
    size: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

export type ContainerVariants = VariantProps<typeof containerVariants>;
