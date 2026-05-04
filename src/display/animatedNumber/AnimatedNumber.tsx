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

export interface AnimatedNumberProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  value: number;
  duration?: number;
  easing?: (t: number) => number;
  format?: (value: number) => ReactNode;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const defaultFormat = (v: number) => v.toFixed(0);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Animates the displayed number whenever `value` changes. rAF tween between
 * the previous and new value. Respects `prefers-reduced-motion`.
 */
export const AnimatedNumber = forwardRef<HTMLElement, AnimatedNumberProps>(
  function AnimatedNumber(
    {
      value,
      duration = 500,
      easing = easeOutCubic,
      format = defaultFormat,
      as = 'span',
      className,
      ...rest
    },
    ref,
  ) {
    const [display, setDisplay] = useState(value);
    const fromRef = useRef(value);

    useEffect(() => {
      if (prefersReducedMotion()) {
        setDisplay(value);
        fromRef.current = value;
        return;
      }
      const from = fromRef.current;
      const to = value;
      if (from === to) return;
      const start = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = easing(t);
        const next = from + (to - from) * eased;
        setDisplay(next);
        if (t < 1) raf = requestAnimationFrame(tick);
        else fromRef.current = to;
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [value, duration, easing]);

    const Tag = as as ElementType;
    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        className={cn('tabular-nums', className)}
        {...rest}
      >
        {format(display)}
      </Tag>
    );
  },
);
