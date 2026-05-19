import { tv, type VariantProps } from '../../utils';

export const avatarVariants = tv({
  base: 'inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-medium',
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
    tone: {
      neutral: 'bg-muted text-muted-foreground',
      primary: 'bg-primary-soft text-primary-soft-foreground',
      danger: 'bg-destructive-soft text-destructive-soft-foreground',
      success: 'bg-success-soft text-success-soft-foreground',
      warning: 'bg-warning-soft text-warning-soft-foreground',
    },
    bgStyle: {
      solid: '',
      // Gradient class composed in compoundVariants × tone.
      gradient: '',
    },
    ring: {
      none: '',
      neutral: 'ring-2 ring-offset-2 ring-border ring-offset-background',
      primary: 'ring-2 ring-offset-2 ring-primary ring-offset-background',
      danger: 'ring-2 ring-offset-2 ring-destructive ring-offset-background',
      success: 'ring-2 ring-offset-2 ring-success ring-offset-background',
      warning: 'ring-2 ring-offset-2 ring-warning ring-offset-background',
    },
    isLoading: {
      true: 'animate-pulse !bg-muted text-transparent',
      false: '',
    },
  },
  compoundVariants: [
    // gradient × tone
    { bgStyle: 'gradient', tone: 'neutral',  class: 'bg-gradient-to-br from-muted to-muted/40' },
    { bgStyle: 'gradient', tone: 'primary',  class: 'bg-gradient-to-br from-primary-soft to-primary text-primary-foreground' },
    { bgStyle: 'gradient', tone: 'danger',   class: 'bg-gradient-to-br from-destructive-soft to-destructive text-destructive-foreground' },
    { bgStyle: 'gradient', tone: 'success',  class: 'bg-gradient-to-br from-success-soft to-success text-success-foreground' },
    { bgStyle: 'gradient', tone: 'warning',  class: 'bg-gradient-to-br from-warning-soft to-warning text-warning-foreground' },
  ],
  defaultVariants: {
    size: 'md',
    shape: 'circle',
    tone: 'neutral',
    bgStyle: 'solid',
    ring: 'none',
    isLoading: false,
  },
});

export type AvatarVariants = VariantProps<typeof avatarVariants>;
