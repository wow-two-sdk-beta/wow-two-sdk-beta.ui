import { Children, cloneElement, forwardRef, isValidElement, useId, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn, Orientation } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { FormControlProvider, useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Fieldset } from '../fieldset/Fieldset';
import { Legend } from '../legend/Legend';
import type { RadioFieldProps } from '../radioField/RadioField';

interface RadioGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'defaultValue'> {
  legend?: ReactNode;
  /** The shared `name` (required for native radio behavior). Auto-generated if omitted. */
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (next: string | null) => void;
  isDisabled?: boolean;
  /** The layout direction. Default `vertical`. */
  orientation?: Orientation;
  children: ReactNode;
}

interface ChildLike extends RadioFieldProps {
  value?: string;
}

/**
 * Mutex group of `RadioField` children. Single-value selection; auto-generates
 * a shared `name` if not provided (the shared name is what powers the native
 * arrow-key roving between radios — always preserved).
 *
 * Form-aware at GROUP level: inside a `Field`/`form.Field` the fieldset (explicit
 * `radiogroup` role) takes the context id (so the `Field` label's `htmlFor`
 * resolves) plus `aria-labelledby`/`aria-describedby`/`aria-invalid`, and the
 * flags cascade to every item — the items themselves get fresh per-item contexts
 * so they keep unique ids.
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  (
    {
      legend,
      name,
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
    const generatedName = useId();
    const groupName = name ?? generatedName;
    const [selected, setSelected] = useControlled<string | null>({
      controlled: value,
      default: defaultValue ?? null,
      onChange: onValueChange,
    });

    return (
      <Fieldset
        ref={ref}
        /* Fieldset's spec-allowed role upgrade — announces "radio group" and
           legitimately supports `aria-invalid` (plain `group` does not). */
        role="radiogroup"
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
                  name: groupName,
                  checked: v !== undefined && selected === v,
                  onChange: () => setSelected(v ?? null),
                } as Partial<ChildLike>)}
              </FormControlProvider>
            );
          })}
        </div>
      </Fieldset>
    );
  },
);
RadioGroup.displayName = 'RadioGroup';

export type { RadioGroupProps };
