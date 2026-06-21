import { Children, cloneElement, forwardRef, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Fieldset } from '../fieldset/Fieldset';
import { Legend } from '../legend/Legend';
import type { CheckboxFieldProps } from '../checkboxField/CheckboxField';

interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /** Group legend (label-equivalent for fieldset). */
  legend?: ReactNode;
  /** Selected values (controlled). */
  value?: string[];
  /** Initial values (uncontrolled). */
  defaultValue?: string[];
  /** Fires whenever selection changes. */
  onValueChange?: (next: string[]) => void;
  /** Disable the whole group. */
  isDisabled?: boolean;
  /** Layout direction. Default `vertical`. */
  orientation?: 'horizontal' | 'vertical';
  /** `<CheckboxField>` children with `value="…"` attached. */
  children: ReactNode;
}

interface ChildLike extends CheckboxFieldProps {
  value?: string;
}

/**
 * Multi-select group of `CheckboxField` children. Each child must declare a
 * `value` prop the group uses to track selection.
 */
export const CheckboxGroup = forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  (
    {
      legend,
      value,
      defaultValue,
      onValueChange,
      isDisabled,
      orientation = 'vertical',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [selected, setSelected] = useControlled<string[]>({
      controlled: value,
      default: defaultValue ?? [],
      onChange: onValueChange,
    });

    const toggle = (v: string | undefined) => {
      if (v === undefined) return;
      setSelected(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
    };

    return (
      <Fieldset ref={ref} disabled={isDisabled} className={cn(className)} {...props}>
        {legend && <Legend>{legend}</Legend>}
        <div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
          {Children.map(children, (child) => {
            if (!isValidElement(child)) return child;
            const c = child as ReactElement<ChildLike>;
            const v = c.props.value;
            return cloneElement(c, {
              checked: v !== undefined && selected.includes(v),
              onChange: () => toggle(v),
            } as Partial<ChildLike>);
          })}
        </div>
      </Fieldset>
    );
  },
);
CheckboxGroup.displayName = 'CheckboxGroup';

export type { CheckboxGroupProps };
