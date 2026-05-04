import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
} from 'react';
import { cn } from '../../utils';

export type ScrollRevealEffect =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom';

export interface ScrollRevealProps extends HTMLAttributes<HTMLElement> {
  effect?: ScrollRevealEffect;
  duration?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'article' | 'span' | 'li';
}

const HIDDEN_TRANSFORMS: Record<ScrollRevealEffect, string> = {
  fade: '',
  'slide-up': 'translateY(20px)',
  'slide-down': 'translateY(-20px)',
  'slide-left': 'translateX(20px)',
  'slide-right': 'translateX(-20px)',
  zoom: 'scale(0.95)',
};

/**
 * Reveal children on enter-viewport. CSS-driven (opacity + transform);
 * IntersectionObserver toggles `data-revealed`. Honors
 * `prefers-reduced-motion` (no transform / opacity at all — content visible
 * from the start).
 */
export const ScrollReveal = forwardRef<HTMLElement, ScrollRevealProps>(
  function ScrollReveal(
    {
      effect = 'fade',
      duration = 600,
      delay = 0,
      threshold = 0.1,
      once = true,
      as = 'div',
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const [revealed, setRevealed] = useState(false);
    const elRef = useRef<HTMLElement | null>(null);
    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

    useEffect(() => {
      if (reduced) {
        setRevealed(true);
        return;
      }
      const el = elRef.current;
      if (!el || typeof IntersectionObserver === 'undefined') {
        setRevealed(true);
        return;
      }
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setRevealed(true);
              if (once) obs.disconnect();
            } else if (!once) {
              setRevealed(false);
            }
          }
        },
        { threshold },
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, [reduced, threshold, once]);

    const Tag = as as ElementType;
    return (
      <Tag
        ref={(el: HTMLElement | null) => {
          elRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = el;
        }}
        data-revealed={revealed || undefined}
        className={cn(className)}
        style={{
          opacity: revealed || reduced ? 1 : 0,
          transform: revealed || reduced ? 'none' : HIDDEN_TRANSFORMS[effect],
          transition: reduced ? undefined : `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
          ...style,
        }}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
