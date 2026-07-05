import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type Ref,
} from 'react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import type { ToggleButtonProps } from '../toggleButton/ToggleButton';

type Mode = 'single' | 'multi';

/**
 * Single-select props, generic over the value type `T`.
 *
 * `T` defaults to `string`, so untyped usage keeps the historical
 * `string | null` shape. Pass a string-literal union or string enum
 * (`<ToggleButtonGroup<GradientType> …>`) to have `value` / `onValueChange`
 * emit that narrowed type instead — no cast needed at the call site.
 */
interface SingleProps<T extends string = string> {
  type?: 'single';
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
}

interface MultiProps {
  type: 'multi';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

type ToggleButtonGroupProps<T extends string = string> = Omit<
  ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'onChange'
> & {
  orientation?: 'horizontal' | 'vertical';
  isAttached?: boolean;
  /**
   * Visual style.
   * - `default` — standard button row/column (borders + attached radii).
   * - `segmented` — iOS-style connected pill row on a muted track; the active
   *   segment lifts to a `background` surface. Forces `isAttached`.
   */
  variant?: 'default' | 'segmented';
} & (SingleProps<T> | MultiProps);

interface ChildLike extends ToggleButtonProps {
  value?: string;
}

/**
 * Generic-callable signature — `forwardRef` erases the type parameter, so the
 * render fn is written against the base `string` shape and the exotic result is
 * re-typed here to preserve `<T>` at the call site.
 */
interface ToggleButtonGroupComponent {
  <T extends string = string>(
    props: ToggleButtonGroupProps<T> & { ref?: Ref<HTMLDivElement> },
  ): ReactElement;
  displayName?: string;
}

/** Coordinates a row/column of ToggleButton children — `type="single" | "multi"`. */
const ToggleButtonGroupImpl = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  (props, ref) => {
    const {
      orientation = 'horizontal',
      isAttached = true,
      variant = 'default',
      className,
      children,
      type,
      value,
      defaultValue,
      onValueChange,
      ...rest
    } = props;
    const mode: Mode = type === 'multi' ? 'multi' : 'single';
    const isSegmented = variant === 'segmented';
    // Segmented is inherently an attached pill row — the muted track only reads as one control when its segments touch.
    const attached = isSegmented || isAttached;

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
          // Segmented: muted track + reset segment chrome; active segment lifts to a `background` surface.
          isSegmented && [
            'rounded-md bg-muted p-1',
            '[&>*]:!rounded-md [&>*]:!ml-0 [&>*]:!border-transparent [&>*]:!bg-transparent',
            '[&>*[data-pressed=true]]:!bg-background [&>*[data-pressed=true]]:!text-foreground [&>*[data-pressed=true]]:shadow-sm',
          ],
          className,
        )}
        {...rest}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          const c = child as ReactElement<ChildLike>;
          const childValue = c.props.value;
          // Compose with the child's own props — explicit `isPressed` wins; child's `onPressedChange` fires before the group toggle.
          return cloneElement(c, {
            isPressed: c.props.isPressed ?? isPressed(childValue),
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
ToggleButtonGroupImpl.displayName = 'ToggleButtonGroup';

/**
 * Public export. The `forwardRef` result is re-typed to the generic-callable
 * signature so `<ToggleButtonGroup<GradientType> …>` narrows `value` /
 * `onValueChange` to `GradientType | null`. Runtime is untouched — this is a
 * type-level cast only.
 */
export const ToggleButtonGroup = ToggleButtonGroupImpl as ToggleButtonGroupComponent;

export type { ToggleButtonGroupProps };
