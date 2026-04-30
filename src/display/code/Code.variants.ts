import { tv, type VariantProps } from '../../utils';

export const codeVariants = tv({
  base: 'font-mono text-sm',
  variants: {
    variant: {
      inline: 'rounded-sm bg-neutral-100 px-1 py-0.5 text-neutral-900',
      block: 'block w-full overflow-x-auto rounded-md bg-neutral-100 p-4 text-neutral-900',
    },
  },
  defaultVariants: {
    variant: 'inline',
  },
});

export type CodeVariants = VariantProps<typeof codeVariants>;
