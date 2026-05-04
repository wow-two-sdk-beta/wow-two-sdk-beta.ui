import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { DismissableLayer, Portal, ScrollLockProvider } from '../../primitives';
import { Backdrop } from '../backdrop';

type SnapPoint = number | string;

interface BottomSheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentSnap: number;
  setCurrentSnap: (i: number) => void;
  snapPoints: SnapPoint[];
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

export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  snapPoints?: SnapPoint[];
  initialSnap?: number;
  dismissOnOutsideClick?: boolean;
  dismissOnEscape?: boolean;
  dragToDismiss?: boolean;
  children: ReactNode;
}

/**
 * Mobile bottom sheet with drag handle + snap points. Pointer-event drag
 * between heights; releasing snaps to the nearest point. Past the lowest
 * snap with `dragToDismiss`, the sheet closes.
 */
export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(function BottomSheet(
  {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    snapPoints = ['40vh', '90vh'],
    initialSnap = 0,
    dismissOnOutsideClick = true,
    dismissOnEscape = true,
    dragToDismiss = true,
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
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const startHeightRef = useRef(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  // Reset to initialSnap each time we re-open.
  useEffect(() => {
    if (open) setCurrentSnap(Math.min(initialSnap, snapPoints.length - 1));
  }, [open, initialSnap, snapPoints.length]);

  const ctx = useMemo<BottomSheetContextValue>(
    () => ({ open, setOpen, currentSnap, setCurrentSnap, snapPoints }),
    [open, setOpen, currentSnap, snapPoints],
  );

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

  if (!open) return null;

  const heightStyle: string | number = (() => {
    if (dragHeight != null) return `${dragHeight}px`;
    const point = snapPoints[currentSnap];
    if (typeof point === 'number') return `${point}px`;
    return point ?? '40vh';
  })();

  return (
    <BottomSheetContext.Provider value={ctx}>
      <Portal>
        <ScrollLockProvider>
          <Backdrop
            inline
            onClick={() => {
              if (dismissOnOutsideClick) setOpen(false);
            }}
          />
          <FocusScope asChild trapped loop>
            <DismissableLayer
              disableEscape={!dismissOnEscape}
              onEscape={() => setOpen(false)}
              disableOutsideClick
            >
              <div
                ref={(el) => {
                  sheetRef.current = el;
                  if (typeof forwardedRef === 'function') forwardedRef(el);
                  else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }}
                role="dialog"
                aria-modal="true"
                style={{
                  height: heightStyle,
                  transition: dragHeight == null ? 'height 220ms ease-out' : 'none',
                }}
                className={cn(
                  'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl border-t border-border bg-card text-card-foreground shadow-2xl outline-none',
                  className,
                )}
                {...rest}
              >
                <div
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
                <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
              </div>
            </DismissableLayer>
          </FocusScope>
        </ScrollLockProvider>
      </Portal>
    </BottomSheetContext.Provider>
  );
});
