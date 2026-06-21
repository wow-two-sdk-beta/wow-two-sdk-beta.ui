import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';

export type AnnotationTone = 'note' | 'comment' | 'suggestion' | 'issue' | 'resolved';

export interface AnnotationMarkerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Wrapped text or content the annotation refers to. Omit for a standalone pin. */
  children?: ReactNode;
  /** Numeric badge / index shown in the pin. */
  index?: number | string;
  /** Tone — drives the highlight color. */
  tone?: AnnotationTone;
  /** Show the marker as a small floating pin without underline. */
  isPinOnly?: boolean;
  /** Marks the annotation as resolved (dimmed, struck-through highlight). */
  isResolved?: boolean;
  /** Marks the annotation as the currently focused / hovered one. */
  isActive?: boolean;
}

const TONE_HIGHLIGHT: Record<AnnotationTone, string> = {
  note: 'bg-info-soft/60 decoration-info',
  comment: 'bg-primary-soft/60 decoration-primary',
  suggestion: 'bg-success-soft/60 decoration-success',
  issue: 'bg-destructive-soft/60 decoration-destructive',
  resolved: 'bg-muted decoration-muted-foreground',
};

const TONE_PIN: Record<AnnotationTone, string> = {
  note: 'bg-info text-info-foreground',
  comment: 'bg-primary text-primary-foreground',
  suggestion: 'bg-success text-success-foreground',
  issue: 'bg-destructive text-destructive-foreground',
  resolved: 'bg-muted-foreground text-background',
};

/**
 * Wraps content (or stands alone) to mark an annotation. Renders as a focusable
 * button; click fires the open-thread flow. `isPinOnly` collapses to just the
 * numbered chip — for margin markers or floating layers (position via `className`).
 */
export const AnnotationMarker = forwardRef<HTMLButtonElement, AnnotationMarkerProps>(
  (
    { children, index, tone = 'comment', isPinOnly, isResolved, isActive, className, ...props },
    ref,
  ) => {
    const effectiveTone: AnnotationTone = isResolved ? 'resolved' : tone;
    const pin = (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
          TONE_PIN[effectiveTone],
        )}
      >
        {index ?? ''}
      </span>
    );

    if (isPinOnly || children == null) {
      return (
        <button
          ref={ref}
          type="button"
          data-tone={effectiveTone}
          data-active={isActive ? '' : undefined}
          className={cn(
            'inline-flex items-center gap-1 align-middle rounded-full ring-1 ring-transparent transition-shadow',
            isActive && 'ring-ring',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
          {...props}
        >
          {pin}
        </button>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        data-tone={effectiveTone}
        data-active={isActive ? '' : undefined}
        className={cn(
          'group inline-flex items-baseline gap-1 align-baseline rounded-sm px-0.5 transition-colors',
          'underline decoration-2 underline-offset-4',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          TONE_HIGHLIGHT[effectiveTone],
          isResolved && 'line-through opacity-70',
          isActive && 'ring-1 ring-ring',
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        {pin}
      </button>
    );
  },
);
AnnotationMarker.displayName = 'AnnotationMarker';
