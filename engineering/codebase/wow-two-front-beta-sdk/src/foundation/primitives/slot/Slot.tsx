import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { useComposedRefs } from '../../utils/composeRefs';

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...childProps };
  for (const key of Object.keys(slotProps)) {
    const slotVal = slotProps[key];
    const childVal = childProps[key];
    if (key === 'className') {
      merged.className = [slotVal, childVal].filter(Boolean).join(' ');
    } else if (key === 'style') {
      merged.style = { ...(slotVal as CSSProperties), ...(childVal as CSSProperties) };
    } else if (/^on[A-Z]/.test(key)) {
      const slotFn = slotVal as ((...args: ReadonlyArray<unknown>) => void) | undefined;
      const childFn = childVal as ((...args: ReadonlyArray<unknown>) => void) | undefined;
      if (slotFn && childFn) {
        merged[key] = (...args: ReadonlyArray<unknown>) => {
          childFn(...args);
          slotFn(...args);
        };
      } else if (slotFn) {
        merged[key] = slotFn;
      }
    } else if (childVal === undefined) {
      merged[key] = slotVal;
    }
  }
  return merged;
}

/*
 * SlotClone — the single-child merge. Clones the one valid child element with
 * the parent's props merged in (className concatenated, handlers chained, refs
 * composed). This is the original `Slot` body, kept intact so existing `asChild`
 * consumers (Button, …) are byte-for-byte unaffected.
 */
const SlotClone = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, forwardedRef) => {
    const child = isValidElement(children)
      ? (children as ReactElement<AnyProps> & { ref?: Ref<HTMLElement> })
      : null;
    const composedRef = useComposedRefs(forwardedRef, child?.ref);
    if (!child) {
      return Children.count(children) > 1 ? Children.only(null) : null;
    }
    const merged = mergeProps(slotProps as AnyProps, (child.props ?? {}) as AnyProps);
    return cloneElement(child, {
      ...merged,
      ref: composedRef,
    });
  },
);
SlotClone.displayName = 'SlotClone';

export interface SlottableProps {
  children?: ReactNode;
}

/**
 * Marks the merge target among a `Slot`'s children. Wrap the consumer's element
 * in `<Slottable>` when the component renders extra content (icons, adornments)
 * around it — the surrounding children then compose *inside* the cloned target,
 * so the single-child `Slot` contract is never violated.
 */
export function Slottable({ children }: SlottableProps) {
  return <>{children}</>;
}
Slottable.displayName = 'Slottable';

function isSlottable(child: ReactNode): child is ReactElement<SlottableProps> {
  return isValidElement(child) && child.type === Slottable;
}

/**
 * Polymorphic slot — renders a single child element with the parent's props
 * merged in (className concatenated, handlers chained, refs composed).
 *
 * Use to enable an `asChild` API on a component:
 * ```tsx
 * <Button asChild><a href="/x">Open</a></Button>
 * ```
 *
 * When one child is wrapped in `<Slottable>`, that element becomes the merge
 * target and the remaining children compose inside it — letting a component
 * render adornments around the consumer's element without breaking the
 * single-child contract:
 * ```tsx
 * <Slot>
 *   <Icon />
 *   <Slottable><a href="/x">Open</a></Slottable>
 * </Slot>
 * // → <a href="/x" {...merged}><Icon />Open</a>
 * ```
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, forwardedRef) => {
    const childrenArray = Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);

    if (slottable) {
      // The `<Slottable>`'s own child is the real merge target (e.g. a router Link).
      const target = slottable.props.children;
      // Rebuild the sibling list, swapping the `<Slottable>` placeholder for the
      // target's original children — so the surrounding nodes compose inside the
      // cloned target: [before…, …targetChildren, …after].
      const newChildren = childrenArray.map((child) => {
        if (child !== slottable) return child;
        return isValidElement<{ children?: ReactNode }>(target) ? target.props.children : null;
      });
      return (
        <SlotClone {...slotProps} ref={forwardedRef}>
          {isValidElement<{ children?: ReactNode }>(target)
            ? cloneElement(target, undefined, newChildren)
            : null}
        </SlotClone>
      );
    }

    return (
      <SlotClone {...slotProps} ref={forwardedRef}>
        {children}
      </SlotClone>
    );
  },
);
Slot.displayName = 'Slot';
