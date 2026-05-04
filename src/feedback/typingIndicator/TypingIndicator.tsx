import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface TypingIndicatorProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Optional name(s) of who is typing — rendered as a leading label. */
  who?: ReactNode;
  /** Visual size of the bouncing dots. */
  size?: 'sm' | 'md' | 'lg';
  /** Color of the dots; defaults to muted. */
  tone?: 'muted' | 'primary' | 'foreground';
  /** Tone-down dot opacity at rest (between bounces). */
  subtle?: boolean;
}

const SIZE: Record<NonNullable<TypingIndicatorProps['size']>, string> = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

const TONE: Record<NonNullable<TypingIndicatorProps['tone']>, string> = {
  muted: 'bg-muted-foreground',
  primary: 'bg-primary',
  foreground: 'bg-foreground',
};

/**
 * Three-dot "someone is typing" indicator. Honors `prefers-reduced-motion`
 * via Tailwind's `motion-safe:` / `motion-reduce:` modifiers — dots stay
 * visible at full opacity when motion is reduced.
 */
export const TypingIndicator = forwardRef<HTMLSpanElement, TypingIndicatorProps>(
  ({ who, size = 'md', tone = 'muted', subtle, className, ...props }, ref) => {
    const dot = cn(
      'inline-block rounded-full motion-safe:animate-bounce',
      SIZE[size],
      TONE[tone],
      subtle && 'motion-safe:opacity-60',
    );
    return (
      <span
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={typeof who === 'string' ? `${who} is typing` : 'Typing'}
        className={cn(
          'inline-flex items-center gap-2 text-xs text-muted-foreground',
          className,
        )}
        {...props}
      >
        {who && <span className="truncate">{who}</span>}
        <span className="inline-flex items-end gap-1" aria-hidden="true">
          <span className={dot} style={{ animationDelay: '0ms' }} />
          <span className={dot} style={{ animationDelay: '150ms' }} />
          <span className={dot} style={{ animationDelay: '300ms' }} />
        </span>
      </span>
    );
  },
);
TypingIndicator.displayName = 'TypingIndicator';
