import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn, Size } from '../../../foundation/utils';

/** Defines the TypingIndicator dot tone. */
export const TypingTone = {
  /** Refers to the muted-foreground tone. */
  Muted: 'muted',
  /** Refers to the primary / brand tone. */
  Primary: 'primary',
  /** Refers to the full-emphasis foreground tone. */
  Foreground: 'foreground',
} as const;

export type TypingTone = (typeof TypingTone)[keyof typeof TypingTone];

export interface TypingIndicatorProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** The optional name(s) of who is typing — rendered as a leading label. */
  who?: ReactNode;

  /** The visual size of the bouncing dots. */
  size?: Size;

  /** The color of the dots; defaults to muted. */
  tone?: TypingTone;

  /** The subtle-mode flag — tones down dot opacity at rest (between bounces). */
  isSubtle?: boolean;
}

/* Only sm/md/lg carry a dot size; other `Size` members fall through to `md`. */
const SIZE: Partial<Record<Size, string>> = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

const TONE: Record<TypingTone, string> = {
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
  ({ who, size = Size.Md, tone = TypingTone.Muted, isSubtle, className, ...props }, ref) => {
    const dot = cn(
      'inline-block rounded-full motion-safe:animate-bounce',
      SIZE[size] ?? SIZE.md,
      TONE[tone],
      isSubtle && 'motion-safe:opacity-60',
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
