import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Portal } from '../../primitives';

export type UndoBarPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface UndoBarProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  message: ReactNode;
  onUndo?: () => void;
  undoLabel?: string;
  /** ms until auto-dismiss; `Infinity` = sticky. Default 5000. */
  duration?: number;
  pauseOnHover?: boolean;
  position?: UndoBarPosition;
  showCountdown?: boolean;
  className?: string;
}

const POSITION: Record<UndoBarPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

/**
 * Snackbar with a single "Undo" action. Auto-dismisses after `duration`;
 * pause-on-hover preserves remaining time. For multi-toast queues use the L5
 * `Toaster` instead.
 */
export function UndoBar({
  open,
  onOpenChange,
  message,
  onUndo,
  undoLabel = 'Undo',
  duration = 5000,
  pauseOnHover = true,
  position = 'bottom-center',
  showCountdown = false,
  className,
}: UndoBarProps) {
  const [progress, setProgress] = useState(1);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number>(0);
  const remainingRef = useRef<number>(duration);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      remainingRef.current = duration;
      setProgress(1);
      return;
    }
    if (duration === Infinity) {
      setProgress(1);
      return;
    }
    if (paused) return;

    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, remainingRef.current - elapsed);
      setProgress(remaining / duration);
      if (remaining <= 0) {
        onOpenChange?.(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      const elapsed = performance.now() - startRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };
  }, [open, duration, paused, onOpenChange]);

  if (!open) return null;

  return (
    <Portal>
      <div
        role="status"
        aria-live="polite"
        onMouseEnter={() => pauseOnHover && setPaused(true)}
        onMouseLeave={() => pauseOnHover && setPaused(false)}
        onFocus={() => pauseOnHover && setPaused(true)}
        onBlur={() => pauseOnHover && setPaused(false)}
        className={cn(
          'fixed z-50 flex items-center gap-3 overflow-hidden rounded-md border border-border bg-popover px-4 py-2.5 text-sm text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-2',
          POSITION[position],
          className,
        )}
      >
        <span className="flex-1">{message}</span>
        {onUndo && (
          <button
            type="button"
            onClick={() => {
              onUndo();
              onOpenChange?.(false);
            }}
            className="font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
          >
            {undoLabel}
          </button>
        )}
        {showCountdown && duration !== Infinity && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-border">
            <div
              className="h-full bg-primary transition-[width] duration-100 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
    </Portal>
  );
}
