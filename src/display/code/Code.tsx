import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { codeVariants, type CodeVariants } from './Code.variants';

export interface CodeProps extends ComponentPropsWithoutRef<'code'>, CodeVariants {}

/**
 * Inline or block code. For block, wrap children in a `<pre>` if you need
 * pre-wrap whitespace; this atom only styles. Syntax highlighting is L5.
 */
export const Code = forwardRef<HTMLElement, CodeProps>(
  ({ className, variant, ...props }, ref) => (
    <code ref={ref} className={cn(codeVariants({ variant }), className)} {...props} />
  ),
);
Code.displayName = 'Code';
