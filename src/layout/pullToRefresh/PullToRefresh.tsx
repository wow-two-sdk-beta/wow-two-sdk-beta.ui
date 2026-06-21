import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { Announce } from '../../primitives';
import { Spinner } from '../../feedback/spinner';

export interface PullToRefreshProps extends HTMLAttributes<HTMLDivElement> {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
  isDisabled?: boolean;
  children: ReactNode;
}

/**
 * Pull-to-refresh wrapper. Listen to pointer drag at scrollTop=0; once past
 * `threshold`, fire `onRefresh`. Visual indicator: spinner that scales in as
 * the user pulls.
 */
export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  function PullToRefresh(
    { onRefresh, threshold = 60, maxPull = 120, isDisabled, className, children, ...rest },
    forwardedRef,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const [pull, setPull] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isDisabled || refreshing) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      startYRef.current = e.clientY;
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (startYRef.current == null) return;
      // Pointer was released outside the container — abandon the gesture.
      if (e.buttons === 0) {
        startYRef.current = null;
        setPull(0);
        return;
      }
      const dy = e.clientY - startYRef.current;
      if (dy < 0) {
        setPull(0);
        return;
      }
      // Resistance: sub-linear growth past threshold.
      const eased = dy < threshold ? dy : threshold + (dy - threshold) * 0.4;
      setPull(Math.min(maxPull, eased));
    };

    const onPointerUp = async () => {
      if (startYRef.current == null) return;
      const reached = pull >= threshold;
      startYRef.current = null;
      if (reached) {
        setRefreshing(true);
        setPull(threshold);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    // Touch: native vertical pan fires pointercancel and kills the gesture.
    // preventDefault touchmove only mid-pull (scrollTop 0, moving down); normal scroll stays native.
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const onTouchMove = (e: TouchEvent) => {
        if (startYRef.current == null || !e.cancelable) return;
        if (el.scrollTop > 0) return;
        const touch = e.touches[0];
        if (!touch) return;
        if (touch.clientY - startYRef.current > 0) e.preventDefault();
      };
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      return () => el.removeEventListener('touchmove', onTouchMove);
    }, []);

    // Releasing the pointer outside the container must still finish the gesture.
    useEffect(() => {
      if (pull === 0) return;
      const finish = () => {
        void onPointerUp();
      };
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
      return () => {
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pull]);

    const reached = pull >= threshold;

    return (
      <div
        ref={(el) => {
          containerRef.current = el;
          if (typeof forwardedRef === 'function') forwardedRef(el);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn('relative h-full overflow-y-auto', className)}
        {...rest}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-raised flex items-center justify-center"
          style={{
            height: pull,
            transition: startYRef.current == null ? 'height 200ms ease-out' : 'none',
          }}
        >
          {pull > 8 && (
            <div
              className={cn(
                'transition-opacity',
                refreshing ? 'opacity-100' : reached ? 'opacity-100' : 'opacity-60',
              )}
              style={{ transform: `scale(${Math.min(1, pull / threshold)})` }}
            >
              <Spinner size="md" tone={reached ? 'brand' : 'default'} />
            </div>
          )}
        </div>
        <div
          style={{
            transform: `translateY(${pull}px)`,
            transition: startYRef.current == null ? 'transform 200ms ease-out' : 'none',
          }}
        >
          {children}
        </div>
        <Announce politeness="polite">
          {refreshing ? 'Refreshing' : ''}
        </Announce>
      </div>
    );
  },
);
