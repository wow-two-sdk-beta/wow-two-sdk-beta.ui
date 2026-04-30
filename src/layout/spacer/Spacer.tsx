import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface SpacerProps extends ComponentPropsWithoutRef<'div'> {
  /** Optional explicit size (CSS length). When inside a flex/grid parent,
   *  the default `flex: 1` already pushes siblings apart. */
  size?: number | string;
  axis?: 'horizontal' | 'vertical';
}

/**
 * A flexible empty box. In a flex parent it expands (`flex: 1`) and pushes
 * siblings to opposite ends. Pass `size` for a fixed gap.
 */
export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, axis = 'horizontal', className, style, ...props }, ref) => {
    const fixed: React.CSSProperties | undefined =
      size !== undefined
        ? axis === 'horizontal'
          ? { width: typeof size === 'number' ? `${size}px` : size, flexShrink: 0 }
          : { height: typeof size === 'number' ? `${size}px` : size, flexShrink: 0 }
        : undefined;

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(size === undefined && 'flex-1', className)}
        style={{ ...fixed, ...style }}
        {...props}
      />
    );
  },
);
Spacer.displayName = 'Spacer';
