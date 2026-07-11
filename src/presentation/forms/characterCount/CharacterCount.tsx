import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../foundation/utils';

export interface CharacterCountProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The current length. */
  value: number;

  /** The maximum allowed length (also flips text to destructive when exceeded). */
  max: number;

  /** The display mode — `current / max` (default) or just `current`. */
  isMaxShown?: boolean;
}

/**
 * Counter for character-limited fields. Drop in below a TextAreaInput / Input.
 * Goes destructive once `value > max`.
 */
export const CharacterCount = forwardRef<HTMLDivElement, CharacterCountProps>(
  ({ value, max, isMaxShown = true, className, ...props }, ref) => {
    const over = value > max;
    return (
      <div
        ref={ref}
        aria-live="polite"
        className={cn(
          'text-right text-xs',
          over ? 'text-destructive' : 'text-muted-foreground',
          className,
        )}
        {...props}
      >
        {value}{isMaxShown && ` / ${max}`}
      </div>
    );
  },
);
CharacterCount.displayName = 'CharacterCount';
