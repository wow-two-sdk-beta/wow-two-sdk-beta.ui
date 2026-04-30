import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
} from 'react';
import { composeRefs } from '../../utils/composeRefs';

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
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
      const slotFn = slotVal as ((...args: unknown[]) => void) | undefined;
      const childFn = childVal as ((...args: unknown[]) => void) | undefined;
      if (slotFn && childFn) {
        merged[key] = (...args: unknown[]) => {
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

/**
 * Polymorphic slot — renders the single child element with the parent's props
 * merged in (className concatenated, handlers chained, refs composed).
 *
 * Use to enable an `asChild` API on a component:
 * ```tsx
 * <Button asChild><a href="/x">Open</a></Button>
 * ```
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, forwardedRef) => {
    if (!isValidElement(children)) {
      return Children.count(children) > 1 ? Children.only(null) : null;
    }
    const child = children as ReactElement<AnyProps> & { ref?: Ref<HTMLElement> };
    const merged = mergeProps(slotProps as AnyProps, (child.props ?? {}) as AnyProps);
    return cloneElement(child, {
      ...merged,
      ref: composeRefs(forwardedRef, child.ref),
    });
  },
);
Slot.displayName = 'Slot';
