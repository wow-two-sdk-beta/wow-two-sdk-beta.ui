import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md' | 'lg';
}

const TRACK_CLASS: Record<NonNullable<SliderProps['size']>, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

/**
 * Single-value range slider — native `<input type="range">` styled across
 * browsers. Multi-thumb / range slider lives at L5.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    { className, size = 'md', id, disabled, required, min = 0, max = 100, ...props },
    ref,
  ) => {
    const ctx = useFormControl();
    return (
      <input
        ref={ref}
        type="range"
        id={id ?? ctx?.id}
        disabled={disabled ?? ctx?.isDisabled}
        required={required ?? ctx?.isRequired}
        min={min}
        max={max}
        aria-invalid={ctx?.isInvalid || undefined}
        className={cn(
          'w-full appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50',
          // WebKit
          '[&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted',
          `[&::-webkit-slider-runnable-track]:${TRACK_CLASS[size]}`,
          '[&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background',
          // Firefox
          `[&::-moz-range-track]:${TRACK_CLASS[size]}`,
          '[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted',
          '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background',
          'focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ring',
          className,
        )}
        {...props}
      />
    );
  },
);
Slider.displayName = 'Slider';
