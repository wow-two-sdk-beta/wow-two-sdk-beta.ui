import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn, dataAttr } from '../../utils';
import { useControlled } from '../../hooks';
import { toggleButtonVariants, type ToggleButtonVariants } from './ToggleButton.variants';

export interface ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'>,
    ToggleButtonVariants {
  /** Controlled pressed state. */
  pressed?: boolean;
  /** Uncontrolled initial state. */
  defaultPressed?: boolean;
  /** Fires whenever pressed state changes. */
  onPressedChange?: (pressed: boolean) => void;
}

/**
 * Two-state button (on / off). Sets `aria-pressed` and `data-state`. Use
 * inside `ToggleButtonGroup` for arrow-key navigation across siblings.
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      pressed,
      defaultPressed = false,
      onPressedChange,
      onClick,
      className,
      variant,
      size,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = useControlled({
      controlled: pressed,
      default: defaultPressed,
      onChange: onPressedChange,
    });
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={value}
        data-state={value ? 'on' : 'off'}
        data-disabled={dataAttr(disabled)}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) setValue(!value);
        }}
        className={cn(toggleButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
ToggleButton.displayName = 'ToggleButton';
