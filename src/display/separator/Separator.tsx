import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface SeparatorProps extends ComponentPropsWithoutRef<'div'> {
  orientation?: 'horizontal' | 'vertical';
  /** When `true`, the separator is purely decorative — `role="none"` and
   *  unannounced. Default `true`. Set `false` when meaningful in context. */
  decorative?: boolean;
}

/**
 * Visual divider. Defaults to a horizontal hairline; pass `orientation="vertical"`
 * for column dividers (use inside a flex/grid with explicit height).
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ orientation = 'horizontal', decorative = true, className, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'bg-neutral-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';
