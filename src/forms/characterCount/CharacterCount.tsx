import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface CharacterCountProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Current length. */
  value: number;
  /** Maximum allowed length (also flips text to destructive when exceeded). */
  max: number;
  /** Show as `current / max` (default) or just `current`. */
  showMax?: boolean;
}

/**
 * Counter for character-limited fields. Drop in below a Textarea / Input.
 * Goes destructive once `value > max`.
 */
export const CharacterCount = forwardRef<HTMLDivElement, CharacterCountProps>(
  ({ value, max, showMax = true, className, ...props }, ref) => {
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
        {value}{showMax && ` / ${max}`}
      </div>
    );
  },
);
CharacterCount.displayName = 'CharacterCount';
