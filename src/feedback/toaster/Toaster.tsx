import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { Announce, Portal, Presence } from '../../primitives';
import { Toast } from '../toast';
import type { ToastSimpleVariants } from '../toastSimple/ToastSimple.variants';

export type ToastSeverity = NonNullable<ToastSimpleVariants['severity']>;

export type ToasterPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  severity?: ToastSeverity;
  /** ms before auto-dismiss. Default: Toaster's `defaultDuration`. `Infinity` = sticky. */
  duration?: number;
  action?: ReactNode;
}

interface ToastEntry extends ToastOptions {
  id: string;
}

type Listener = (toasts: ToastEntry[]) => void;

class ToasterStore {
  private items: ToastEntry[] = [];
  private listeners = new Set<Listener>();
  private idSeq = 0;

  toast(opts: ToastOptions): string {
    const id = `t_${++this.idSeq}`;
    this.items = [...this.items, { id, ...opts }];
    this.emit();
    return id;
  }

  dismiss(id: string): void {
    this.items = this.items.filter((t) => t.id !== id);
    this.emit();
  }

  dismissAll(): void {
    this.items = [];
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.items);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    for (const fn of this.listeners) fn(this.items);
  }
}

export const toaster = new ToasterStore();

export function useToaster() {
  return useMemo(
    () => ({
      toast: (opts: ToastOptions) => toaster.toast(opts),
      dismiss: (id: string) => toaster.dismiss(id),
      dismissAll: () => toaster.dismissAll(),
    }),
    [],
  );
}

const POSITION_CLASSES: Record<ToasterPosition, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

/**
 * Enter/exit animation per position, gated on `data-state` (set by `Presence`)
 * and `motion-safe:` so reduced-motion users get an instant swap. Corner
 * toasts slide along their horizontal edge; centered toasts slide along the
 * vertical axis they're anchored to. Exit anims are shorter (`--duration-fast`).
 */
const MOTION_CLASSES: Record<ToasterPosition, string> = {
  'top-right':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-right) motion-safe:data-[state=closed]:animate-(--animate-slide-out-right) motion-reduce:animate-none',
  'top-left':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-left) motion-safe:data-[state=closed]:animate-(--animate-slide-out-left) motion-reduce:animate-none',
  'top-center':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-top) motion-safe:data-[state=closed]:animate-(--animate-slide-out-top) motion-reduce:animate-none',
  'bottom-right':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-right) motion-safe:data-[state=closed]:animate-(--animate-slide-out-right) motion-reduce:animate-none',
  'bottom-left':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-left) motion-safe:data-[state=closed]:animate-(--animate-slide-out-left) motion-reduce:animate-none',
  'bottom-center':
    'motion-safe:data-[state=open]:animate-(--animate-slide-in-bottom) motion-safe:data-[state=closed]:animate-(--animate-slide-out-bottom) motion-reduce:animate-none',
};

export interface ToasterProps {
  position?: ToasterPosition;
  max?: number;
  /** ms; per-toast `duration` overrides. Default 5000. `Infinity` to disable. */
  defaultDuration?: number;
  canPauseOnHover?: boolean;
  gap?: number;
  className?: string;
}

interface VisibleToast extends ToastEntry {
  resolvedDuration: number;
}

/**
 * Per-toast animated wrapper. `forwardRef` + `{...props}` spread so the
 * `data-state` Presence sets lands on this node (and Presence can ref it to
 * await `animationend` before unmount). Carries the slide+fade motion classes.
 *
 * Runs an unmount-only cleanup that calls `onRemoved` — since `Presence` keeps
 * this child mounted until its exit animation ends, that cleanup is our
 * "exit finished" signal (the read-only `Presence` API exposes no callback).
 */
interface ToastItemProps extends HTMLAttributes<HTMLDivElement> {
  motionClass: string;
  onRemoved?: () => void;
}

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(
  ({ motionClass, onRemoved, className, children, ...props }, ref) => {
    const onRemovedRef = useRef(onRemoved);
    onRemovedRef.current = onRemoved;
    useEffect(() => () => onRemovedRef.current?.(), []);
    return (
      <div
        ref={ref}
        className={cn('pointer-events-auto w-80', motionClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ToastItem.displayName = 'ToastItem';

/**
 * Viewport that subscribes to the global `toaster` store and renders toasts
 * via the L4 `Toast` molecule. Mount once, per app.
 */
export function Toaster({
  position = 'bottom-right',
  max = 5,
  defaultDuration = 5000,
  canPauseOnHover = true,
  gap = 8,
  className,
}: ToasterProps) {
  const [items, setItems] = useState<ToastEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const timersRef = useRef(new Map<string, number>());
  const remainingRef = useRef(new Map<string, number>());
  const startRef = useRef(new Map<string, number>());

  useEffect(() => {
    return toaster.subscribe(setItems);
  }, []);

  // Visible window (FIFO).
  const visible: VisibleToast[] = items.slice(0, max).map((t) => ({
    ...t,
    resolvedDuration: t.duration ?? defaultDuration,
  }));
  const visibleIds = useMemo(() => new Set(visible.map((v) => v.id)), [visible]);

  // Toasts that just left `visible` (dismissed, or pushed out of the FIFO
  // window) but must still play their exit animation. Kept mounted with
  // `data-state="closed"` until `Presence` unmounts the child — `ToastItem`
  // then fires `onRemoved`, pruning the entry here.
  const [exiting, setExiting] = useState<VisibleToast[]>([]);
  const prevVisibleRef = useRef<VisibleToast[]>([]);

  useEffect(() => {
    const gone = prevVisibleRef.current.filter((p) => !visibleIds.has(p.id));
    prevVisibleRef.current = visible;
    setExiting((cur) => {
      const known = new Set(cur.map((e) => e.id));
      // Add newly-gone toasts; drop any that re-entered `visible`.
      const merged = [...cur, ...gone.filter((g) => !known.has(g.id))].filter(
        (e) => !visibleIds.has(e.id),
      );
      return merged.length === cur.length &&
        merged.every((e, i) => e.id === cur[i]?.id)
        ? cur
        : merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds]);

  const removeExiting = (id: string) =>
    setExiting((cur) => cur.filter((e) => e.id !== id));

  // Visible (present) first, then the ones animating out.
  const rendered: Array<VisibleToast & { present: boolean }> = [
    ...visible.map((v) => ({ ...v, present: true })),
    ...exiting.map((e) => ({ ...e, present: false })),
  ];

  const latestTitle =
    typeof visible[visible.length - 1]?.title === 'string'
      ? (visible[visible.length - 1]!.title as string)
      : visible[visible.length - 1]?.description && typeof visible[visible.length - 1]!.description === 'string'
        ? (visible[visible.length - 1]!.description as string)
        : '';

  // Schedule auto-dismiss timers.
  useEffect(() => {
    const ids = new Set(visible.map((v) => v.id));
    // Clear timers for items that are no longer visible.
    for (const [id, h] of timersRef.current) {
      if (!ids.has(id)) {
        window.clearTimeout(h);
        timersRef.current.delete(id);
        remainingRef.current.delete(id);
        startRef.current.delete(id);
      }
    }
    if (paused) return;
    for (const v of visible) {
      if (v.resolvedDuration === Infinity) continue;
      if (timersRef.current.has(v.id)) continue;
      const remaining = remainingRef.current.get(v.id) ?? v.resolvedDuration;
      const handle = window.setTimeout(() => {
        toaster.dismiss(v.id);
      }, remaining);
      timersRef.current.set(v.id, handle);
      startRef.current.set(v.id, Date.now());
      remainingRef.current.set(v.id, remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, max, defaultDuration, paused]);

  // Cleanup on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const h of timers.values()) window.clearTimeout(h);
      timers.clear();
    };
  }, []);

  const handlePause = () => {
    if (!canPauseOnHover || paused) return;
    setPaused(true);
    for (const [id, h] of timersRef.current) {
      window.clearTimeout(h);
      const start = startRef.current.get(id) ?? Date.now();
      const prev = remainingRef.current.get(id) ?? 0;
      const elapsed = Date.now() - start;
      remainingRef.current.set(id, Math.max(0, prev - elapsed));
    }
    timersRef.current.clear();
  };

  const handleResume = () => {
    if (!canPauseOnHover || !paused) return;
    setPaused(false);
  };

  if (rendered.length === 0) {
    return (
      <Portal>
        <Announce politeness="polite" />
      </Portal>
    );
  }

  return (
    <Portal>
      <div
        aria-label="Notifications"
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onFocus={handlePause}
        onBlur={handleResume}
        style={{ gap }}
        className={cn(
          'pointer-events-none fixed z-toast flex flex-col',
          POSITION_CLASSES[position],
          className,
        )}
      >
        {rendered.map((t) => (
          <Presence key={t.id} isPresent={t.present}>
            <ToastItem
              motionClass={MOTION_CLASSES[position]}
              onRemoved={t.present ? undefined : () => removeExiting(t.id)}
            >
              <Toast
                icon={t.icon}
                title={t.title}
                description={t.description}
                severity={t.severity}
                actions={t.action}
                onClose={() => toaster.dismiss(t.id)}
              />
            </ToastItem>
          </Presence>
        ))}
      </div>
      <Announce politeness="polite">{latestTitle}</Announce>
    </Portal>
  );
}
