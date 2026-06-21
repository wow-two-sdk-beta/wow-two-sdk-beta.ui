import { Children, cloneElement, forwardRef, isValidElement, useId, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Fieldset } from '../fieldset/Fieldset';
import { Legend } from '../legend/Legend';
import type { RadioFieldProps } from '../radioField/RadioField';

interface RadioGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'defaultValue'> {
  legend?: ReactNode;
  /** Shared `name` (required for native radio behavior). Auto-generated if omitted. */
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (next: string | null) => void;
  isDisabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
}

interface ChildLike extends RadioFieldProps {
  value?: string;
}

/**
 * Mutex group of `RadioField` children. Single-value selection; auto-generates
 * a shared `name` if not provided.
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
      orientation = 'vertical',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const generatedName = useId();
    const groupName = name ?? generatedName;
    const [selected, setSelected] = useControlled<string | null>({
      controlled: value,
      default: defaultValue ?? null,
      onChange: onValueChange,
    });

    return (
      <Fieldset ref={ref} disabled={isDisabled} className={cn(className)} {...props}>
        {legend && <Legend>{legend}</Legend>}
        <div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
          {Children.map(children, (child) => {
            if (!isValidElement(child)) return child;
            const c = child as ReactElement<ChildLike>;
            const v = c.props.value;
            return cloneElement(c, {
              name: groupName,
              checked: v !== undefined && selected === v,
              onChange: () => setSelected(v ?? null),
            } as Partial<ChildLike>);
          })}
        </div>
      </Fieldset>
    );
  },
);
RadioGroup.displayName = 'RadioGroup';

export type { RadioGroupProps };
