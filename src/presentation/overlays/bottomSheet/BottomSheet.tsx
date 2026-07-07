import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn, composeRefs, surfaceVariants, type SurfaceVariants } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { DismissableLayer, Portal, Presence, ScrollLockProvider } from '../../../foundation/primitives';
import { Backdrop } from '../backdrop';
import {
  OverlayChromeProvider,
  OverlayDescription,
  OverlayTitle,
  type OverlayChromeContextValue,
} from '../OverlayChrome';

type SnapPoint = number | string;

interface BottomSheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentSnap: number;
  setCurrentSnap: (i: number) => void;
  snapPoints: ReadonlyArray<SnapPoint>;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheet() {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) throw new Error('useBottomSheet must be used inside <BottomSheet>');
  return ctx;
}

function resolveSnapPx(point: SnapPoint, viewport: number): number {
  if (typeof point === 'number') return point;
  const trimmed = point.trim();
  if (trimmed.endsWith('vh')) return (parseFloat(trimmed) / 100) * viewport;
  if (trimmed.endsWith('px')) return parseFloat(trimmed);
  if (trimmed.endsWith('%')) return (parseFloat(trimmed) / 100) * viewport;
  // Fallback: try parseFloat as px.
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : 0;
}

/** Represents the prop surface of `BottomSheet`. */
export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement>, SurfaceVariants {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  snapPoints?: ReadonlyArray<SnapPoint>;
  initialSnap?: number;
  dismissOnOutsideClick?: boolean;
  dismissOnEscape?: boolean;
  dragToDismiss?: boolean;
  children: ReactNode;
}

/**
 * The full portal subtree (scroll-lock + backdrop + focus-trap + dialog
 * panel), rendered as the single child of `<Presence>` — mirroring Drawer.
 * Presence injects `data-state` ("open" | "closed") + a `ref` here; both are
 * forwarded to the sheet panel — the element whose `transition-transform` end
 * defers unmount. Keeping the whole subtree (FocusScope included) inside one
 * Presence holds the focus trap + scroll lock through the exit slide and
 * releases them on unmount, so FocusScope's teardown hands focus back to the
 * previously-focused element (the opener).
 */
interface BottomSheetSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** The consumer ref for the panel — passed as a prop because Presence's cloned `ref` replaces the element's own. */
  panelRef?: React.Ref<HTMLDivElement>;
  dismissOnOutsideClick: boolean;
  dismissOnEscape: boolean;
  dragToDismiss: boolean;
  titleId: string;
  descriptionId: string;
  chromeCtx: OverlayChromeContextValue;
  surfaceClassName: string;
  children: ReactNode;
}

const BottomSheetSurface = forwardRef<HTMLDivElement, BottomSheetSurfaceProps>(
  function BottomSheetSurface(
    {
      panelRef,
      dismissOnOutsideClick,
      dismissOnEscape,
      dragToDismiss,
      titleId,
      descriptionId,
      chromeCtx,
      surfaceClassName,
      children,
      // `data-state` is injected by Presence; default to "open" when rendered standalone.
      'data-state': dataState = 'open',
      ...rest
    }: BottomSheetSurfaceProps & { 'data-state'?: 'open' | 'closed' },
    forwardedRef,
  ) {
    const { open, setOpen, currentSnap, setCurrentSnap, snapPoints } = useBottomSheet();
    const sheetRef = useRef<HTMLDivElement | null>(null);
    const handleRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const startHeightRef = useRef(0);
    const [dragHeight, setDragHeight] = useState<number | null>(null);

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
      startYRef.current = e.clientY;
      const rect = sheetRef.current?.getBoundingClientRect();
      startHeightRef.current = rect ? rect.height : 0;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (startYRef.current == null) return;
      const dy = e.clientY - startYRef.current;
      setDragHeight(Math.max(0, startHeightRef.current - dy));
    };

    const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (startYRef.current == null) return;
      startYRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

      const viewport = typeof window !== 'undefined' ? window.innerHeight : 800;
      const heights = snapPoints.map((p) => resolveSnapPx(p, viewport));
      const liveHeight = dragHeight ?? heights[currentSnap] ?? 0;
      setDragHeight(null);

      // Below lowest snap by 60px → dismiss.
      if (dragToDismiss && liveHeight < (heights[0] ?? 0) - 60) {
        setOpen(false);
        return;
      }
      // Snap to nearest.
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      heights.forEach((h, i) => {
        const d = Math.abs(h - liveHeight);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      setCurrentSnap(bestIdx);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowUp' && currentSnap < snapPoints.length - 1) {
        e.preventDefault();
        setCurrentSnap(currentSnap + 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSnap > 0) setCurrentSnap(currentSnap - 1);
        else if (dragToDismiss) setOpen(false);
      }
    };

    const heightStyle: string | number = (() => {
      if (dragHeight != null) return `${dragHeight}px`;
      const point = snapPoints[currentSnap];
      if (typeof point === 'number') return `${point}px`;
      return point ?? '40vh';
    })();

    return (
      <Portal>
        <ScrollLockProvider>
          {/* Backdrop in its own Presence so its fade-out plays before unmount;
              `Presence` injects `data-state` onto it and the fade tokens gate on it. */}
          <Presence isPresent={open}>
            <Backdrop
              isInline
              className={cn(
                'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
                'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
              )}
              onClick={() => {
                if (dismissOnOutsideClick) setOpen(false);
              }}
            />
          </Presence>
          <FocusScope
            asChild
            trapped
            loop
            onMountAutoFocus={(event) => {
              // The drag handle is the sheet's primary keyboard affordance
              // (ArrowUp/ArrowDown drive the snap state) — give it initial
              // focus instead of FocusScope's default first-tabbable walk,
              // which falls back to the layer container here.
              event.preventDefault();
              handleRef.current?.focus();
            }}
          >
            <DismissableLayer
              isEscapeDisabled={!dismissOnEscape}
              onEscape={() => setOpen(false)}
              isOutsideClickDisabled
            >
              {/* The sheet panel is the Presence-animated node — it carries
                  `data-state` (forwarded from the Surface clone) and the slide
                  classes. FULL slide from the bottom edge: translate-y-full
                  when closed, driven by `transition-transform` (the inline
                  transition also carries `transform` so the height + slide
                  animate together). Gated `motion-safe` + `motion-reduce` so
                  reduced-motion users get no movement. */}
              <div
                ref={composeRefs(forwardedRef, panelRef, sheetRef)}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                data-state={dataState}
                style={{
                  height: heightStyle,
                  transition:
                    dragHeight == null
                      ? 'height 220ms ease-out, transform var(--duration-base) var(--ease-out)'
                      : 'none',
                }}
                className={surfaceClassName}
                {...rest}
              >
                <div
                  ref={handleRef}
                  role="separator"
                  aria-orientation="horizontal"
                  aria-valuenow={currentSnap}
                  aria-valuemin={0}
                  aria-valuemax={snapPoints.length - 1}
                  tabIndex={0}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onKeyDown={handleKeyDown}
                  className="flex h-7 cursor-ns-resize items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <OverlayChromeProvider value={chromeCtx}>{children}</OverlayChromeProvider>
                </div>
              </div>
            </DismissableLayer>
          </FocusScope>
        </ScrollLockProvider>
      </Portal>
    );
  },
);
BottomSheetSurface.displayName = 'BottomSheetSurface';

/**
 * Mobile bottom sheet with drag handle + snap points. Pointer-event drag
 * between heights; releasing snaps to the nearest point. Past the lowest
 * snap with `dragToDismiss`, the sheet closes.
 */
const BottomSheetRoot = forwardRef<HTMLDivElement, BottomSheetProps>(function BottomSheet(
  {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    snapPoints = ['40vh', '90vh'],
    initialSnap = 0,
    dismissOnOutsideClick = true,
    dismissOnEscape = true,
    dragToDismiss = true,
    variant,
    tone,
    radius,
    padding,
    elevation,
    className,
    children,
    ...rest
  },
  forwardedRef,
) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [currentSnap, setCurrentSnap] = useState(
    Math.min(initialSnap, snapPoints.length - 1),
  );
  const titleId = useId();
  const descriptionId = useId();

  // Reset to initialSnap each time we re-open.
  useEffect(() => {
    if (open) setCurrentSnap(Math.min(initialSnap, snapPoints.length - 1));
  }, [open, initialSnap, snapPoints.length]);

  const ctx = useMemo<BottomSheetContextValue>(
    () => ({ open, setOpen, currentSnap, setCurrentSnap, snapPoints }),
    [open, setOpen, currentSnap, snapPoints],
  );

  const chromeCtx = useMemo<OverlayChromeContextValue>(
    () => ({ titleId, descriptionId, close: () => setOpen(false) }),
    [titleId, descriptionId, setOpen],
  );

  const surfaceClassName = cn(
    'fixed inset-x-0 bottom-0 z-modal flex flex-col rounded-t-xl border-t outline-none',
    'will-change-transform',
    'motion-safe:data-[state=closed]:translate-y-full',
    'motion-reduce:translate-y-0',
    surfaceVariants({
      variant: variant ?? 'elevated',
      tone,
      radius: radius ?? 'none',
      padding: padding ?? 'none',
      elevation: elevation ?? 5,
    }),
    className,
  );

  // Presence keeps the whole surface (scroll lock + backdrop + focus trap +
  // panel) mounted through the exit slide, flipping data-state open→closed
  // and deferring unmount until the panel's transition ends.
  return (
    <BottomSheetContext.Provider value={ctx}>
      <Presence isPresent={open}>
        <BottomSheetSurface
          panelRef={forwardedRef}
          dismissOnOutsideClick={dismissOnOutsideClick}
          dismissOnEscape={dismissOnEscape}
          dragToDismiss={dragToDismiss}
          titleId={titleId}
          descriptionId={descriptionId}
          chromeCtx={chromeCtx}
          surfaceClassName={surfaceClassName}
          {...rest}
        >
          {children}
        </BottomSheetSurface>
      </Presence>
    </BottomSheetContext.Provider>
  );
});

// Re-export shared chrome under the BottomSheet namespace — they wire
// `id={titleId}`/`id={descriptionId}` so the sheet's aria-labelledby/describedby resolve.
export const BottomSheetTitle = OverlayTitle;
export const BottomSheetDescription = OverlayDescription;

export const BottomSheet = Object.assign(BottomSheetRoot, {
  Title: BottomSheetTitle,
  Description: BottomSheetDescription,
});

export default BottomSheet;
