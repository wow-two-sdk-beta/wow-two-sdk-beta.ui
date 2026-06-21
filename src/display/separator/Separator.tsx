import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface SeparatorProps extends ComponentPropsWithoutRef<'div'> {
  orientation?: 'horizontal' | 'vertical';
  /** Purely decorative — `role="none"`, unannounced. Default `true`; set `false` when meaningful in context. */
  isDecorative?: boolean;
}

/**
 * Visual divider. Defaults to a horizontal hairline; pass `orientation="vertical"`
 * for column dividers (use inside a flex/grid with explicit height).
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ orientation = 'horizontal', isDecorative = true, className, ...props }, ref) => (
    <div
      ref={ref}
      role={isDecorative ? 'none' : 'separator'}
      aria-orientation={isDecorative ? undefined : orientation}
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';
