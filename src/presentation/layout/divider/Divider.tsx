import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn, Orientation } from '../../../foundation/utils';
import { dividerVariants } from './Divider.variants';

export interface DividerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The axis of the rule. Default `horizontal`. */
  orientation?: Orientation;

  /**
   * The centered content overlaid on the rule — the classic "or" separator.
   * Horizontal only (ignored when `orientation="vertical"`). When present the rule
   * is split either side of the label and the divider is exposed as a labelled
   * (non-decorative) separator.
   */
  label?: ReactNode;
}

/**
 * A thin rule that separates content, using the semantic `border` token.
 * Plain by default; pass `label` for a horizontal rule with centered content
 * (e.g. `<Divider label="or" />`) sitting on the surface background.
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = Orientation.Horizontal, label, className, ...props }, ref) => {
    if (label != null && orientation === Orientation.Horizontal) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn('flex w-full items-center gap-3', className)}
          {...props}
        >
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(dividerVariants({ orientation }), className)}
        {...props}
      />
    );
  },
);
Divider.displayName = 'Divider';
