import { tv, type VariantProps } from '../../utils';

export const colorSwatchVariants = tv({
  base: 'inline-block shrink-0 border border-border bg-[image:linear-gradient(45deg,_#ddd_25%,_transparent_25%),_linear-gradient(-45deg,_#ddd_25%,_transparent_25%),_linear-gradient(45deg,_transparent_75%,_#ddd_75%),_linear-gradient(-45deg,_transparent_75%,_#ddd_75%)] bg-[length:8px_8px] bg-[position:0_0,_0_4px,_4px_-4px,_-4px_0px]',
  variants: {
    size: {
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-6 w-6',
      lg: 'h-9 w-9',
    },
    shape: {
      square: 'rounded-sm',
      circle: 'rounded-full',
    },
    interactive: {
      true: 'cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:shadow-sm',
      false: '',
    },
    selected: {
      true: 'ring-2 ring-ring ring-offset-1',
      false: '',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'square',
    interactive: false,
    selected: false,
    disabled: false,
  },
});

export type ColorSwatchVariants = VariantProps<typeof colorSwatchVariants>;
