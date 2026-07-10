import { Children, cloneElement, forwardRef, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn, Orientation } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { FormControlProvider, useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Fieldset } from '../fieldset/Fieldset';
import { Legend } from '../legend/Legend';
import type { CheckboxFieldProps } from '../checkboxField/CheckboxField';

interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /** The group legend (label-equivalent for fieldset). */
  legend?: ReactNode;

  /** The selected values (controlled). */
  value?: ReadonlyArray<string>;

  /** The initial values (uncontrolled). */
  defaultValue?: ReadonlyArray<string>;

  /** Emits the selected values whenever selection changes. */
  onValueChange?: (next: ReadonlyArray<string>) => void;

  /** The disabled state for the whole group. */
  isDisabled?: boolean;

  /** The layout direction. Default `vertical`. */
  orientation?: Orientation;

  /** The `<CheckboxField>` children with `value="…"` attached. */
  children: ReactNode;
}

interface ChildLike extends CheckboxFieldProps {
  value?: string;
}

/**
 * Multi-select group of `CheckboxField` children. Each child must declare a
 * `value` prop the group uses to track selection.
 *
 * Form-aware at GROUP level: inside a `Field`/`form.Field` the fieldset takes the
 * context id (so the `Field` label's `htmlFor` resolves) plus `aria-labelledby`/
 * `aria-describedby`/`aria-invalid`, and the flags cascade to every item — the
 * items themselves get fresh per-item contexts so they keep unique ids.
 */
export const CheckboxGroup = forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  (
    {
      legend,
      value,
      defaultValue,
      onValueChange,
      isDisabled,
      orientation = Orientation.Vertical,
      id,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = useFormControl();
    const isGroupDisabled = isDisabled ?? ctx?.isDisabled;
    const isGroupInvalid = ctx?.isInvalid ?? false;
    const [selected, setSelected] = useControlled<ReadonlyArray<string>>({
      controlled: value,
      default: defaultValue ?? [],
      onChange: onValueChange,
    });

    const toggle = (v: string | undefined) => {
      if (v === undefined) return;
      setSelected(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
    };

    return (
      <Fieldset
        ref={ref}
        id={id ?? ctx?.id}
        disabled={isGroupDisabled}
        aria-labelledby={ctx?.labelledBy}
        aria-describedby={ctx?.describedBy}
        aria-invalid={isGroupInvalid || undefined}
        className={cn(className)}
        {...props}
      >
        {legend && <Legend>{legend}</Legend>}
        <div className={cn('flex gap-3', orientation === Orientation.Vertical ? 'flex-col' : 'flex-row flex-wrap')}>
          {Children.map(children, (child) => {
            if (!isValidElement(child)) return child;
            const c = child as ReactElement<ChildLike>;
            const v = c.props.value;
            return (
              /* Fresh per-item provider — severs the group-level context so sibling
                 items don't all adopt `ctx.id` (duplicate DOM ids) or the group's
                 `describedBy`, while still cascading the disabled/invalid flags. */
              <FormControlProvider isDisabled={isGroupDisabled} isInvalid={isGroupInvalid}>
                {cloneElement(c, {
                  checked: v !== undefined && selected.includes(v),
                  onChange: () => toggle(v),
                } as Partial<ChildLike>)}
              </FormControlProvider>
            );
          })}
        </div>
      </Fieldset>
    );
  },
);
CheckboxGroup.displayName = 'CheckboxGroup';

export type { CheckboxGroupProps };
