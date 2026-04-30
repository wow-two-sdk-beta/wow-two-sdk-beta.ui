import { tv, type VariantProps } from '../../utils';

export const avatarVariants = tv({
  base: 'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-neutral-700 font-medium',
  variants: {
    size: {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
      '2xl': 'h-20 w-20 text-2xl',
    },
    shape: {
      circle: 'rounded-full',
      square: 'rounded-md',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'circle',
  },
});

export type AvatarVariants = VariantProps<typeof avatarVariants>;
