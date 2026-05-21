import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Button, type ButtonProps } from '../button/Button';
import { toggleButtonVariants, type ToggleButtonVariants } from './ToggleButton.variants';

const COMPONENT_NAME = 'ToggleButton';

/* Render-prop signature for state-aware content/labels. */
type PressedFn<T> = (args: { pressed: boolean }) => T;
type StateAware<T> = T | PressedFn<T>;

/* Children may be static OR a render-prop receiving `{ pressed }` — render-prop enables icon-swap patterns (e.g., Eye ↔ EyeOff) for both controlled and uncontrolled toggles. */
type ToggleButtonChildren = StateAware<ReactNode>;

export interface ToggleButtonProps
  extends Omit<ButtonProps, 'variant' | 'tone' | 'children' | 'title' | 'aria-label'>,
    ToggleButtonVariants {
  /* Controlled pressed state. */
  pressed?: boolean;

  /* Uncontrolled initial state. Ignored if `pressed` is set. */
  defaultPressed?: boolean;

  /* Fires whenever pressed state changes. */
  onPressedChange?: (pressed: boolean) => void;

  /* Static content OR render-prop receiving `{ pressed }` for state-driven swap. */
  children?: ToggleButtonChildren;

  /* Tooltip text — string OR fn receiving `{ pressed }`. State-aware form keeps consumer-supplied strings (i18n discipline). */
  title?: StateAware<string>;

  /* Accessible label — string OR fn. Use when icon-only or when `aria-pressed` alone is insufficient context for screen readers. */
  'aria-label'?: StateAware<string>;
}

/* Two-state action button (on/off) — sets `aria-pressed` + `data-pressed="true|false"`. Wraps Button to inherit size union, shape, asChild, loading, padding/radius. Press appearance lives in `toggleButtonVariants` (variant × tone matrix); ToggleButton's own appearance overrides Button's neutral-ghost baseline via class order. */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      pressed,
      defaultPressed,
      onPressedChange,
      onClick,
      variant = 'ghost',
      tone = 'primary',
      className,
      children,
      title,
      'aria-label': ariaLabel,
      ...buttonProps
    },
    ref,
  ) => {
    const [value, setValue] = useControlled({
      controlled: pressed,
      default: defaultPressed ?? false,
      onChange: onPressedChange,
    });

    const renderedChildren =
      typeof children === 'function' ? children({ pressed: value }) : children;

    /* Resolve state-aware string props to plain strings for the underlying Button. */
    const resolvedTitle =
      typeof title === 'function' ? title({ pressed: value }) : title;
    const resolvedAriaLabel =
      typeof ariaLabel === 'function' ? ariaLabel({ pressed: value }) : ariaLabel;

    return (
      <Button
        ref={ref}
        /* Neutral baseline — ToggleButton's compound classes paint over Button's defaults via class order. */
        variant="ghost"
        tone="neutral"
        aria-pressed={value}
        aria-label={resolvedAriaLabel}
        data-pressed={value ? 'true' : 'false'}
        title={resolvedTitle}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) setValue(!value);
        }}
        className={cn(toggleButtonVariants({ variant, tone }), className)}
        {...buttonProps}
      >
        {renderedChildren}
      </Button>
    );
  },
);

ToggleButton.displayName = COMPONENT_NAME;
