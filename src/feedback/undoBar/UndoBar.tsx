import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, surfaceVariants } from '../../utils';
import { Portal, Presence } from '../../primitives';

export type UndoBarPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface UndoBarProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  message: ReactNode;
  onUndo?: () => void;
  undoLabel?: string;
  /** ms until auto-dismiss; `Infinity` = sticky. Default 5000. */
  duration?: number;
  canPauseOnHover?: boolean;
  position?: UndoBarPosition;
  hasCountdown?: boolean;
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
  isOpen,
  onOpenChange,
  message,
  onUndo,
  undoLabel = 'Undo',
  duration = 5000,
  canPauseOnHover = true,
  position = 'bottom-center',
  hasCountdown = false,
  className,
}: UndoBarProps) {
  const [progress, setProgress] = useState(1);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number>(0);
  const remainingRef = useRef<number>(duration);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
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
    if (!hasCountdown) {
      // No visible countdown — a single timeout, no per-frame re-renders.
      const handle = window.setTimeout(() => {
        onOpenChange?.(false);
      }, remainingRef.current);
      return () => {
        window.clearTimeout(handle);
        const elapsed = performance.now() - startRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      };
    }
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
  }, [isOpen, duration, paused, hasCountdown, onOpenChange]);

  return (
    /* Static positioning wrapper holds the fixed corner + (for `*-center`) the
       centering `-translate-x-1/2`; the inner `UndoBarPanel` carries the slide
       keyframe, whose own `translateY` would otherwise clobber that centering
       translate if both sat on one node. `Portal` stays mounted; `Presence`
       owns the panel's mount so the exit (slide-out + fade) plays before
       unmount, cloning `ref` + `data-state` onto the panel for its motion. */
    <Portal>
      <div className={cn('fixed z-toast', POSITION[position])}>
        <Presence isPresent={isOpen}>
          <UndoBarPanel
            onMouseEnter={() => canPauseOnHover && setPaused(true)}
            onMouseLeave={() => canPauseOnHover && setPaused(false)}
            onFocus={() => canPauseOnHover && setPaused(true)}
            onBlur={() => canPauseOnHover && setPaused(false)}
            className={className}
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
            {hasCountdown && duration !== Infinity && (
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-border">
                <div
                  className="h-full bg-primary transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            )}
          </UndoBarPanel>
        </Presence>
      </div>
    </Portal>
  );
}

/**
 * `Presence`-clonable bar: a single `forwardRef` element that spreads the
 * injected `ref` + `data-state` ("open" | "closed") onto its node and runs the
 * enter/exit tokens off that state. forwardRef + `{...props}` are required so
 * the ref and `data-state` actually land here. Enter slides up from below +
 * fades in; exit slides down + fades out. Reduced motion gets neither.
 */
const UndoBarPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function UndoBarPanel({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          'relative flex items-center gap-3 overflow-hidden text-sm',
          surfaceVariants({ variant: 'surface', radius: 'md', padding: 'sm', elevation: 3 }),
          'px-4 py-2.5',
          /* slide-in-bottom/out-bottom carry their own fade; gated on data-state +
             motion-safe so reduced-motion users get no movement. */
          'motion-safe:data-[state=open]:animate-(--animate-slide-in-bottom)',
          'motion-safe:data-[state=closed]:animate-(--animate-slide-out-bottom)',
          'motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
