import { tv, type VariantProps } from '../../utils';

export const overlayButtonVariants = tv({
  base: 'absolute z-10 inline-flex items-center justify-center rounded-full bg-inverse/70 text-inverse-foreground backdrop-blur-sm transition-opacity hover:bg-inverse/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  variants: {
    size: {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
    },
    position: {
      'top-right': 'top-2 right-2',
      'top-left': 'top-2 left-2',
      'bottom-right': 'bottom-2 right-2',
      'bottom-left': 'bottom-2 left-2',
      center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    appearOn: {
      always: 'opacity-100',
      hover: 'opacity-0 group-hover:opacity-100',
    },
  },
  defaultVariants: {
    size: 'sm',
    position: 'top-right',
    appearOn: 'always',
  },
});

export type OverlayButtonVariants = VariantProps<typeof overlayButtonVariants>;
