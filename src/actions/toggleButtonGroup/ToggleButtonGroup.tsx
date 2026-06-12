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

/** Coordinates a row/column of ToggleButton children — `type="single" | "multi"`. */
export const ToggleButtonGroup = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  (props, ref) => {
    const {
      orientation = 'horizontal',
      attached = true,
      className,
      children,
      type,
      value,
      defaultValue,
      onValueChange,
      ...rest
    } = props;
    const mode: Mode = type === 'multi' ? 'multi' : 'single';

    const [singleValue, setSingleValue] = useControlled<string | null>({
      controlled: mode === 'single' ? (value as string | null | undefined) : undefined,
      default: mode === 'single' ? (defaultValue as string | null | undefined) ?? null : null,
      onChange:
        mode === 'single' ? (onValueChange as ((value: string | null) => void) | undefined) : undefined,
    });
    const [multiValue, setMultiValue] = useControlled<string[]>({
      controlled: mode === 'multi' ? (value as string[] | undefined) : undefined,
      default: mode === 'multi' ? (defaultValue as string[] | undefined) ?? [] : [],
      onChange:
        mode === 'multi' ? (onValueChange as ((value: string[]) => void) | undefined) : undefined,
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
        role="group"
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
        {...rest}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          const c = child as ReactElement<ChildLike>;
          const childValue = c.props.value;
          // Compose with the child's own props — an explicit `pressed` wins, and
          // the child's own `onPressedChange` still fires before the group toggle.
          return cloneElement(c, {
            pressed: c.props.pressed ?? isPressed(childValue),
            onPressedChange: (pressed: boolean) => {
              c.props.onPressedChange?.(pressed);
              togglePressed(childValue);
            },
          } as Partial<ChildLike>);
        })}
      </div>
    );
  },
);
ToggleButtonGroup.displayName = 'ToggleButtonGroup';

export type { ToggleButtonGroupProps };
