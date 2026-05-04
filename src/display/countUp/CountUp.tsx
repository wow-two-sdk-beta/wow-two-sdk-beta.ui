import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';

export interface CountUpProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  to: number;
  from?: number;
  duration?: number;
  easing?: (t: number) => number;
  format?: (value: number) => ReactNode;
  triggerOnView?: boolean;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const defaultFormat = (v: number) => v.toFixed(0);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Number that animates up to `to` on mount (or on enter-viewport when
 * `triggerOnView`). rAF tween; respects `prefers-reduced-motion` (jumps
 * straight to `to`).
 */
export const CountUp = forwardRef<HTMLElement, CountUpProps>(function CountUp(
  {
    to,
    from = 0,
    duration = 1500,
    easing = easeOutCubic,
    format = defaultFormat,
    triggerOnView = false,
    as = 'span',
    className,
    ...rest
  },
  ref,
) {
  const [value, setValue] = useState(triggerOnView ? from : to);
  const elRef = useRef<HTMLElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(to);
      return;
    }
    if (triggerOnView && typeof IntersectionObserver !== 'undefined' && elRef.current) {
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !startedRef.current) {
              startedRef.current = true;
              animate();
            }
          }
        },
        { threshold: 0.2 },
      );
      obs.observe(elRef.current);
      return () => obs.disconnect();
    }
    animate();

    function animate() {
      const start = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = easing(t);
        setValue(from + (to - from) * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
  }, [to, from, duration, easing, triggerOnView]);

  const Tag = as as ElementType;
  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        elRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      className={cn('tabular-nums', className)}
      {...rest}
    >
      {format(value)}
    </Tag>
  );
});
