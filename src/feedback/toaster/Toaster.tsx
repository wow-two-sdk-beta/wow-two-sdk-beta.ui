import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { Announce, Portal } from '../../primitives';
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

export interface ToasterProps {
  position?: ToasterPosition;
  max?: number;
  /** ms; per-toast `duration` overrides. Default 5000. `Infinity` to disable. */
  defaultDuration?: number;
  pauseOnHover?: boolean;
  gap?: number;
  className?: string;
}

interface VisibleToast extends ToastEntry {
  resolvedDuration: number;
}

/**
 * Viewport that subscribes to the global `toaster` store and renders toasts
 * via the L4 `Toast` molecule. Mount once, per app.
 */
export function Toaster({
  position = 'bottom-right',
  max = 5,
  defaultDuration = 5000,
  pauseOnHover = true,
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
  const latestTitle =
    typeof visible[visible.length - 1]?.title === 'string'
      ? (visible[visible.length - 1]!.title as string)
      : visible[visible.length - 1]?.description && typeof visible[visible.length - 1]!.description === 'string'
        ? (visible[visible.length - 1]!.description as string)
        : '';

  // Schedule auto-dismiss timers.
  useEffect(() => {
    const visibleIds = new Set(visible.map((v) => v.id));
    // Clear timers for items that are no longer visible.
    for (const [id, h] of timersRef.current) {
      if (!visibleIds.has(id)) {
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
    if (!pauseOnHover || paused) return;
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
    if (!pauseOnHover || !paused) return;
    setPaused(false);
  };

  if (visible.length === 0) {
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
          'pointer-events-none fixed z-50 flex flex-col',
          POSITION_CLASSES[position],
          className,
        )}
      >
        {visible.map((t) => (
          <div key={t.id} className="pointer-events-auto w-80 animate-in fade-in-0 slide-in-from-bottom-2">
            <Toast
              icon={t.icon}
              title={t.title}
              description={t.description}
              severity={t.severity}
              actions={t.action}
              onClose={() => toaster.dismiss(t.id)}
            />
          </div>
        ))}
      </div>
      <Announce politeness="polite">{latestTitle}</Announce>
    </Portal>
  );
}
