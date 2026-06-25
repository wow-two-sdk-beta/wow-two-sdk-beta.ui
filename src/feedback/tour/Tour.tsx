import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../../utils';
import { useControlled, useReducedMotion } from '../../hooks';
import { Announce, Portal, Presence } from '../../primitives';

export interface TourStep {
  target: string | RefObject<HTMLElement>;
  title?: ReactNode;
  body?: ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export interface TourProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  steps: TourStep[];
  currentStep?: number;
  defaultCurrentStep?: number;
  onStepChange?: (i: number) => void;
  onComplete?: () => void;
  onSkip?: () => void;
  padding?: number;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function rectFromTarget(target: TourStep['target']): Rect | null {
  let el: HTMLElement | null = null;
  if (typeof target === 'string') {
    el = document.querySelector(target);
  } else {
    el = target.current;
  }
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function placementCoords(rect: Rect, placement: NonNullable<TourStep['placement']>, gap = 12) {
  switch (placement) {
    case 'top':
      return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' };
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.left + rect.width + gap, transform: 'translate(0, -50%)' };
    case 'bottom':
      return { top: rect.top + rect.height + gap, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' };
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: 'translate(-100%, -50%)' };
  }
}

/**
 * Multi-step product tour. Renders an SVG mask with a cutout around each
 * step's target + a floating tooltip with Next / Prev / Skip / Done.
 */
export function Tour({
  isOpen: openProp,
  defaultOpen = false,
  onOpenChange,
  steps,
  currentStep: currentStepProp,
  defaultCurrentStep = 0,
  onStepChange,
  onComplete,
  onSkip,
  padding = 8,
}: TourProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [currentStep, setCurrentStep] = useControlled({
    controlled: currentStepProp,
    default: defaultCurrentStep,
    onChange: onStepChange,
  });

  const [rect, setRect] = useState<Rect | null>(null);
  const titleId = useId();
  const descId = useId();
  const maskId = useId();
  const reducedMotion = useReducedMotion();

  const step = steps[currentStep];

  /* Keep the Portal (scrim + tooltip) mounted while the pop-out plays — the
     component hard-unmounts on `!open`, which would kill the exit. Opening
     flips this true synchronously; closing defers the unmount until the
     tooltip's exit animation ends (`onAnimationEnd` below). Under reduced
     motion no animation fires, so drop it on the next frame instead. */
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!reducedMotion) return;
    const raf = requestAnimationFrame(() => setMounted(false));
    return () => cancelAnimationFrame(raf);
  }, [open, reducedMotion]);

  // Update rect when step changes / window scrolls / resizes.
  useEffect(() => {
    if (!open || !step) return;

    const update = () => {
      const r = rectFromTarget(step.target);
      setRect(r);
    };
    // Defer to next frame so the target can mount / scroll into view.
    const handle = requestAnimationFrame(update);

    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, step]);

  // Escape handling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        onSkip?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen, onSkip]);

  const goNext = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setOpen(false);
      onComplete?.();
    } else {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length, setOpen, setCurrentStep, onComplete]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep, setCurrentStep]);

  const skip = useCallback(() => {
    setOpen(false);
    onSkip?.();
  }, [setOpen, onSkip]);

  if (!mounted || !step) return null;

  const placement = step.placement ?? 'bottom';
  const tooltipCoords = rect ? placementCoords(rect, placement) : null;
  const cutoutPadding = padding;

  return (
    <Portal>
      {/* SVG mask backdrop with cutout around target. Skipped while the
          target is unresolvable so a bare scrim never blocks the page.
          Gated on `open` (not `mounted`) so the scrim clears immediately on
          close while the tooltip plays its pop-out before unmount. */}
      {open && rect && (
        <svg
          aria-hidden="true"
          className="pointer-events-auto fixed inset-0 z-modal h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - cutoutPadding}
                y={rect.top - cutoutPadding}
                width={rect.width + cutoutPadding * 2}
                height={rect.height + cutoutPadding * 2}
                rx={6}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask={`url(#${maskId})`}
          />
        </svg>
      )}

      {/* Tooltip — wrapped in `Presence` so its pop-out plays before the
          component unmounts. `Presence` clones `data-state` ("open" | "closed")
          + a `ref` onto the panel, so the pop tokens run gated on that state;
          the exit's `onAnimationEnd` drops `mounted`. */}
      {tooltipCoords && (
        <Presence isPresent={open}>
          <TourTooltip
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            aria-describedby={descId}
            style={{
              position: 'fixed',
              top: tooltipCoords.top,
              left: tooltipCoords.left,
              transform: tooltipCoords.transform,
            }}
            onAnimationEnd={() => {
              /* Drop the Portal once the exit animation completes. */
              if (!open) setMounted(false);
            }}
          >
            {step.title && (
              <div id={titleId} className="text-sm font-semibold">
                {step.title}
              </div>
            )}
            {step.body && (
              <div id={descId} className={cn('text-sm text-muted-foreground', step.title && 'mt-1.5')}>
                {step.body}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} / {steps.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={skip}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Skip
                </button>
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {currentStep >= steps.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </TourTooltip>
        </Presence>
      )}

      <Announce politeness="polite">
        {step.title
          ? `Step ${currentStep + 1} of ${steps.length}: ${typeof step.title === 'string' ? step.title : ''}`
          : ''}
      </Announce>
    </Portal>
  );
}

/**
 * `Presence`-clonable tooltip panel: a single `forwardRef` element that
 * spreads `data-state` ("open" | "closed", injected by `Presence`) + the
 * `ref` onto its node, so the pop (fade + slight scale) runs gated on that
 * state. forwardRef + `{...props}` spread are required so the ref and
 * `data-state` actually land here. `motion-safe` so reduced-motion users get
 * no movement.
 */
const TourTooltip = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { style?: CSSProperties }
>(function TourTooltip({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'z-popover w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none',
        'motion-safe:data-[state=open]:animate-(--animate-pop-in)',
        'motion-safe:data-[state=closed]:animate-(--animate-pop-out)',
        'motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
