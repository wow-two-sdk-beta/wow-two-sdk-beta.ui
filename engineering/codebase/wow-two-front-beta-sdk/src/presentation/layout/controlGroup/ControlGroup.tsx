import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn, Orientation } from '../../../foundation/utils';
import { controlGroupVariants } from './ControlGroup.variants';

/** Defines props for a labelled group of controls. */
export interface ControlGroupProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The group's label — muted; sits beside the control(s) when horizontal, above them when vertical. */
  label: ReactNode;

  /** The label-to-control arrangement — `horizontal` (label beside) or `vertical` (label above). Default `horizontal`. */
  orientation?: Orientation;

  /** The hairline between this and the next group (settings-list look). Default `true`. */
  divided?: boolean;

  /** The fixed label width for the horizontal layout — pass to align labels across a stack of rows, e.g. `"6rem"`. Omit for content-driven width. */
  labelWidth?: string;

  /** The control(s) bound to the label. */
  children: ReactNode;
}

/**
 * Renders a labelled group of controls — a muted label bound to its control(s),
 * laid out horizontally (label beside) or vertically (label above). Stacked
 * groups auto-divide via a hairline unless `divided={false}`.
 */
export const ControlGroup = forwardRef<HTMLDivElement, ControlGroupProps>(
  ({ label, orientation = Orientation.Horizontal, divided = true, labelWidth, children, className, ...props }, ref) => {
    const styles = controlGroupVariants({ orientation, divided });
    return (
      <div ref={ref} className={cn(styles.root(), className)} {...props}>
        <span
          className={styles.label()}
          style={labelWidth ? { flex: `0 0 ${labelWidth}` } : undefined}
        >
          {label}
        </span>
        <div className={styles.content()}>{children}</div>
      </div>
    );
  },
);

ControlGroup.displayName = 'ControlGroup';
