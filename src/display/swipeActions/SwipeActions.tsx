import {
  forwardRef,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';

export interface SwipeActionsProps extends HTMLAttributes<HTMLDivElement> {
  left?: ReactNode;
  right?: ReactNode;
  /** px the user must drag before the row snaps open. */
  threshold?: number;
  /** Used to compute snap distance. Width per action button (px). */
  actionWidth?: number;
  isDisabled?: boolean;
  children: ReactNode;
}

type Side = 'left' | 'right' | null;

/** px of pointer travel beyond which the gesture counts as a drag, not a tap. */
const CLICK_SUPPRESS_SLOP = 6;

/**
 * Drag a row left/right to reveal action slots. Pointer-event based — works
 * with touch and mouse. Tap the row body while open to close.
 */
export const SwipeActions = forwardRef<HTMLDivElement, SwipeActionsProps>(
  function SwipeActions(
    {
      left,
      right,
      threshold = 60,
      actionWidth = 72,
      isDisabled,
      className,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const startXRef = useRef<number | null>(null);
    const startOffsetRef = useRef(0);
    const suppressClickRef = useRef(false);
    const [offset, setOffset] = useState(0);
    const [openSide, setOpenSide] = useState<Side>(null);

    const leftSlots = countNodes(left);
    const rightSlots = countNodes(right);
    const leftMax = leftSlots * actionWidth;
    const rightMax = rightSlots * actionWidth;

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isDisabled) return;
      startXRef.current = e.clientX;
      startOffsetRef.current = offset;
      suppressClickRef.current = false;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isDisabled || startXRef.current == null) return;
      if (Math.abs(e.clientX - startXRef.current) > CLICK_SUPPRESS_SLOP) {
        suppressClickRef.current = true;
      }
      const dx = e.clientX - startXRef.current + startOffsetRef.current;
      const clamped = Math.max(-rightMax, Math.min(leftMax, dx));
      setOffset(clamped);
    };

    const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (startXRef.current == null) return;
      startXRef.current = null;
      (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
      // Snap.
      if (offset > threshold && leftMax > 0) {
        setOffset(leftMax);
        setOpenSide('left');
      } else if (offset < -threshold && rightMax > 0) {
        setOffset(-rightMax);
        setOpenSide('right');
      } else {
        setOffset(0);
        setOpenSide(null);
      }
    };

    const close = () => {
      setOffset(0);
      setOpenSide(null);
    };

    const onClick = () => {
      // Mouse drags always emit a click after pointerup — swallow it so a
      // drag-to-open doesn't instantly close. Plain taps still close.
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (openSide) close();
    };

    return (
      <div
        ref={forwardedRef}
        className={cn(
          'relative overflow-hidden bg-card text-card-foreground',
          className,
        )}
        {...rest}
      >
        {left && (
          <div
            className="absolute inset-y-0 left-0 flex"
            style={{ width: leftMax }}
            aria-hidden={openSide !== 'left'}
          >
            {left}
          </div>
        )}
        {right && (
          <div
            className="absolute inset-y-0 right-0 flex"
            style={{ width: rightMax }}
            aria-hidden={openSide !== 'right'}
          >
            {right}
          </div>
        )}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          style={{
            transform: `translateX(${offset}px)`,
            transition: startXRef.current == null ? 'transform 200ms ease-out' : 'none',
            touchAction: 'pan-y',
          }}
          className="relative bg-card"
        >
          {children}
        </div>
      </div>
    );
  },
);

function countNodes(node: ReactNode): number {
  if (!node) return 0;
  if (Array.isArray(node)) return node.length;
  return 1;
}
