import { tv, type VariantProps } from '../../utils';

export const codeVariants = tv({
  base: 'font-mono text-sm',
  variants: {
    variant: {
      inline: 'rounded-sm bg-muted px-1 py-0.5 text-foreground',
      block: 'block w-full overflow-x-auto rounded-md bg-muted p-4 text-foreground',
    },
  },
  defaultVariants: {
    variant: 'inline',
  },
});

export type CodeVariants = VariantProps<typeof codeVariants>;
