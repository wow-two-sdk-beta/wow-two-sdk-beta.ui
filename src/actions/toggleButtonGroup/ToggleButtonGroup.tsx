import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
} from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import type { ToggleButtonProps } from '../toggleButton/ToggleButton';

type Mode = 'single' | 'multi';

interface SingleProps {
  type?: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface MultiProps {
  type: 'multi';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

type ToggleButtonGroupProps = Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> & {
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
} & (SingleProps | MultiProps);

interface ChildLike extends ToggleButtonProps {
  value?: string;
}

/**
 * Coordinates a row/column of `ToggleButton` children. `type="single"` (default)
 * tracks one active value; `type="multi"` tracks an array. Each child must
 * expose a `value` prop that the group uses as its identifier.
 */
export const ToggleButtonGroup = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  (props, ref) => {
    const { orientation = 'horizontal', attached = true, className, children, ...rest } = props;
    const mode: Mode = props.type === 'multi' ? 'multi' : 'single';

    const [singleValue, setSingleValue] = useControlled<string | null>({
      controlled: mode === 'single' ? (rest as SingleProps).value : undefined,
      default: mode === 'single' ? (rest as SingleProps).defaultValue ?? null : null,
      onChange: mode === 'single' ? (rest as SingleProps).onValueChange : undefined,
    });
    const [multiValue, setMultiValue] = useControlled<string[]>({
      controlled: mode === 'multi' ? (rest as MultiProps).value : undefined,
      default: mode === 'multi' ? (rest as MultiProps).defaultValue ?? [] : [],
      onChange: mode === 'multi' ? (rest as MultiProps).onValueChange : undefined,
    });

    const isPressed = (childValue: string | undefined): boolean => {
      if (childValue === undefined) return false;
      return mode === 'single' ? singleValue === childValue : multiValue.includes(childValue);
    };
    const togglePressed = (childValue: string | undefined) => {
      if (childValue === undefined) return;
      if (mode === 'single') {
        setSingleValue(singleValue === childValue ? null : childValue);
      } else {
        setMultiValue(
          multiValue.includes(childValue)
            ? multiValue.filter((v) => v !== childValue)
            : [...multiValue, childValue],
        );
      }
    };

    return (
      <div
        ref={ref}
        role={mode === 'single' ? 'radiogroup' : 'group'}
        data-orientation={orientation}
        className={cn(
          'inline-flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          attached
            ? orientation === 'horizontal'
              ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
              : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px'
            : 'gap-2',
          className,
        )}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          const c = child as ReactElement<ChildLike>;
          const childValue = c.props.value;
          return cloneElement(c, {
            pressed: isPressed(childValue),
            onPressedChange: () => togglePressed(childValue),
          } as Partial<ChildLike>);
        })}
      </div>
    );
  },
);
ToggleButtonGroup.displayName = 'ToggleButtonGroup';

export type { ToggleButtonGroupProps };
