import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export type BackToTopPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left';

export interface BackToTopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Scroll distance (px) before the button appears. Default 400. */
  threshold?: number;
  /** Scope to a specific scrollable element. Defaults to the window. */
  scrollContainer?: HTMLElement | null;
  position?: BackToTopPosition;
  /** Visible label. Omit for icon-only. */
  label?: ReactNode;
  'aria-label'?: string;
}

const POSITION: Record<BackToTopPosition, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

/**
 * Floating button that appears after the user scrolls past `threshold`.
 * Click scrolls the target back to top with smooth-scroll (skipped under
 * `prefers-reduced-motion`).
 */
export const BackToTopButton = forwardRef<HTMLButtonElement, BackToTopButtonProps>(
  function BackToTopButton(
    {
      threshold = 400,
      scrollContainer,
      position = 'bottom-right',
      label,
      'aria-label': ariaLabel = 'Back to top',
      className,
      onClick,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const el: HTMLElement | Window = scrollContainer ?? window;
      const read = () => {
        const y =
          'scrollY' in el ? (el as Window).scrollY : (el as HTMLElement).scrollTop;
        setVisible(y >= threshold);
      };
      read();
      const target = el as EventTarget;
      target.addEventListener('scroll', read, { passive: true });
      return () => target.removeEventListener('scroll', read);
    }, [threshold, scrollContainer]);

    if (!visible) return null;

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          const reducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          const target = scrollContainer ?? window;
          if ('scrollTo' in target) {
            (target as Window | HTMLElement).scrollTo({
              top: 0,
              behavior: reducedMotion ? 'auto' : 'smooth',
            });
          }
        }}
        className={cn(
          'fixed z-40 inline-flex items-center justify-center gap-2 rounded-full bg-card text-card-foreground shadow-lg ring-1 ring-border transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          label ? 'h-11 px-4 text-sm font-medium' : 'h-11 w-11',
          POSITION[position],
          className,
        )}
        {...rest}
      >
        <Icon icon={ArrowUp} size={16} />
        {label}
      </button>
    );
  },
);
BackToTopButton.displayName = 'BackToTopButton';
