import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { Label } from '../label/Label';

/** @deprecated Prefer `Field` (was `FormField`) or compose `Label` + a control directly. */
export interface LabeledInputProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  label: ReactNode;
  /** The input element. Receives a generated `id` linked to the label. */
  children: React.ReactElement<{ id?: string }>;

  /** The optional inline-end label (e.g. "Optional"). */
  trailing?: ReactNode;
}

/**
 * Lighter alternative to `Field` — just `Label` + control, no helper / error /
 * context wiring. Good for compact inline forms.
 *
 * @deprecated Prefer `Field` (was `FormField`) for label + control + helper/error,
 * or compose `Label` + a control directly. Kept for one release.
 */
export const LabeledInput = forwardRef<HTMLDivElement, LabeledInputProps>(
  ({ label, children, trailing, className, ...props }, ref) => {
    const generated = useId();
    const id = children.props.id ?? generated;
    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props}>
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
          {trailing && <span className="text-xs text-muted-foreground">{trailing}</span>}
        </div>
        {React.cloneElement(children, { id })}
      </div>
    );
  },
);
LabeledInput.displayName = 'LabeledInput';

import * as React from 'react';
