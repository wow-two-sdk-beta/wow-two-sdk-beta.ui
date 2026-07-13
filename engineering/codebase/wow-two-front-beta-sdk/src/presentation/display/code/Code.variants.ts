import { tv, type VariantProps } from '../../../foundation/utils';

/** Defines the Code rendering mode. */
export const CodeVariant = {
  /** Refers to inline code within a text run. */
  Inline: 'inline',
  /** Refers to a full-width block. */
  Block: 'block',
} as const;

export type CodeVariant = (typeof CodeVariant)[keyof typeof CodeVariant];

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

/* Compile-time lock: enum values ≡ tv variant value-set (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertCodeVariant: AssertExact<
  CodeVariant,
  NonNullable<VariantProps<typeof codeVariants>['variant']>
> = true;
void _assertCodeVariant;
