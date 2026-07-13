import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type Ref,
} from 'react';
import { cn, Orientation } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import type { ToggleButtonProps } from '../toggleButton/ToggleButton';
import {
  ToggleButtonGroupVariant,
  ToggleItemRole,
  ToggleMode,
} from './ToggleButtonGroup.variants';

/**
 * Single-select props, generic over the value type `T`.
 *
 * `T` defaults to `string`, so untyped usage keeps the historical
 * `string | null` shape. Pass a string-literal union or string enum
 * (`<ToggleButtonGroup<GradientType> …>`) to have `value` / `onValueChange`
 * emit that narrowed type instead — no cast needed at the call site.
 */
interface SingleProps<T extends string = string> {
  /** The selection cardinality — omit or `ToggleMode.Single` for at-most-one. */
  type?: typeof ToggleMode.Single;
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
}

interface MultiProps {
  /** The selection cardinality — `ToggleMode.Multi` for any-number-active. */
  type: typeof ToggleMode.Multi;
  value?: ReadonlyArray<string>;
  defaultValue?: ReadonlyArray<string>;
  onValueChange?: (value: ReadonlyArray<string>) => void;
}

type ToggleButtonGroupProps<T extends string = string> = Omit<
  ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'onChange'
> & {
  /** The layout axis of the button row/column. @default Orientation.Horizontal */
  orientation?: Orientation;
  isAttached?: boolean;
  /**
   * The visual style.
   * - `default` — standard button row/column (borders + attached radii).
   * - `segmented` — iOS-style connected pill row on a muted track; the active
   *   segment lifts to a `background` surface. Forces `isAttached`.
   * - `pill` — individually-separated rounded pills (each item its own detached
   *   chip). Forces detached (never attaches).
   */
  variant?: ToggleButtonGroupVariant;
  /**
   * The ARIA role wiring.
   * - `group` (default) — `role="group"` of independent toggle buttons.
   * - `tab` — opt into tablist semantics: root renders `role="tablist"` and each
   *   item `role="tab"` + `aria-selected`. Pairs naturally with single-select.
   * @default ToggleItemRole.Group
   */
  itemRole?: ToggleItemRole;
  /**
   * The equal-width state — lays items out as equal-width tiles (each `flex-1 basis-0`)
   * for an icon category strip where every cell should share the row width. Additive;
   * the default keeps intrinsic item widths.
   * @default false
   */
  equalWidth?: boolean;
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
      orientation = Orientation.Horizontal,
      isAttached = true,
      variant = ToggleButtonGroupVariant.Default,
      itemRole = ToggleItemRole.Group,
      equalWidth = false,
      className,
      children,
      type,
      value,
      defaultValue,
      onValueChange,
      ...rest
    } = props;
    const mode: ToggleMode = type === ToggleMode.Multi ? ToggleMode.Multi : ToggleMode.Single;
    const isSegmented = variant === ToggleButtonGroupVariant.Segmented;
    const isPill = variant === ToggleButtonGroupVariant.Pill;
    const isTablist = itemRole === ToggleItemRole.Tab;
    const isHorizontal = orientation === Orientation.Horizontal;
    // Segmented is inherently an attached pill row — the muted track only reads as one control when its
    // segments touch. Pill is the inverse — always detached chips, never attached.
    const attached = isPill ? false : isSegmented || isAttached;

    const [singleValue, setSingleValue] = useControlled<string | null>({
      controlled: mode === ToggleMode.Single ? (value as string | null | undefined) : undefined,
      default:
        mode === ToggleMode.Single ? ((defaultValue as string | null | undefined) ?? null) : null,
      onChange:
        mode === ToggleMode.Single
          ? (onValueChange as ((value: string | null) => void) | undefined)
          : undefined,
    });
    const [multiValue, setMultiValue] = useControlled<ReadonlyArray<string>>({
      controlled: mode === ToggleMode.Multi ? (value as string[] | undefined) : undefined,
      default: mode === ToggleMode.Multi ? ((defaultValue as string[] | undefined) ?? []) : [],
      onChange:
        mode === ToggleMode.Multi
          ? (onValueChange as ((value: ReadonlyArray<string>) => void) | undefined)
          : undefined,
    });

    const isPressed = (childValue: string | undefined): boolean => {
      if (childValue === undefined) return false;
      return mode === ToggleMode.Single
        ? singleValue === childValue
        : multiValue.includes(childValue);
    };
    const togglePressed = (childValue: string | undefined) => {
      if (childValue === undefined) return;
      if (mode === ToggleMode.Single) {
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
        role={isTablist ? 'tablist' : 'group'}
        aria-orientation={isTablist ? orientation : undefined}
        data-orientation={orientation}
        className={cn(
          'inline-flex',
          isHorizontal ? 'flex-row' : 'flex-col',
          attached
            ? isHorizontal
              ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
              : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px'
            : 'gap-2',
          // Segmented: muted track + reset segment chrome; active segment lifts to a `background` surface.
          isSegmented && [
            'rounded-md bg-muted p-1',
            '[&>*]:!rounded-md [&>*]:!ml-0 [&>*]:!border-transparent [&>*]:!bg-transparent',
            '[&>*[data-pressed=true]]:!bg-background [&>*[data-pressed=true]]:!text-foreground [&>*[data-pressed=true]]:shadow-sm',
          ],
          // Pill: fully-rounded detached chips (gap already applied via the non-attached branch above).
          isPill && '[&>*]:!rounded-full',
          // Equal-width tiles: every item shares the row/column extent (icon category strip).
          equalWidth && '[&>*]:flex-1 [&>*]:basis-0',
          className,
        )}
        {...rest}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          const c = child as ReactElement<ChildLike>;
          const childValue = c.props.value;
          const pressed = c.props.isPressed ?? isPressed(childValue);
          // Compose with the child's own props — explicit `isPressed` wins; child's `onPressedChange`
          // fires before the group toggle. Tablist mode layers `role="tab"` + `aria-selected` on each item.
          return cloneElement(c, {
            isPressed: pressed,
            onPressedChange: (isPressedNext: boolean) => {
              c.props.onPressedChange?.(isPressedNext);
              togglePressed(childValue);
            },
            ...(isTablist ? { role: 'tab', 'aria-selected': pressed } : {}),
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
