import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useReducedMotion } from '../../hooks';

export interface LiveCursorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Pixel offset from the parent's top-left corner. */
  x: number;
  y: number;
  /** Display name to show beside the pointer. */
  name?: ReactNode;
  /** CSS color used for the pointer fill and label background. */
  color?: string;
  /** Smooth movement between updates. Defaults to true; auto-disables with reduced motion. */
  smooth?: boolean;
  /** Pixels offset for the label relative to the pointer. */
  labelOffset?: { x?: number; y?: number };
  /** Hide the label and show only the pointer. */
  pointerOnly?: boolean;
}

/**
 * Remote-user cursor for collaborative canvases. Wrap in a `relative`-
 * positioned container; the cursor places itself absolutely at `(x, y)`.
 * Movement is smoothed with a short transition unless `prefers-reduced-
 * motion: reduce` is set.
 */
export const LiveCursor = forwardRef<HTMLDivElement, LiveCursorProps>(
  (
    {
      x,
      y,
      name,
      color = 'var(--color-primary)',
      smooth = true,
      labelOffset,
      pointerOnly,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const reducedMotion = useReducedMotion();
    const useTransition = smooth && !reducedMotion;
    const lx = labelOffset?.x ?? 12;
    const ly = labelOffset?.y ?? 16;

    const wrapperStyle: CSSProperties = {
      transform: `translate3d(${x}px, ${y}px, 0)`,
      transition: useTransition ? 'transform 80ms linear' : undefined,
      ...style,
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-50 select-none',
          className,
        )}
        style={wrapperStyle}
        {...props}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <path
            d="M5 3 L5 19 L9.5 14.5 L12.5 21 L15.5 19.5 L12.5 13 L19 13 Z"
            fill={color}
            stroke="white"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
        {name && !pointerOnly && (
          <span
            className="absolute whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none text-white shadow-sm"
            style={{ backgroundColor: color, transform: `translate(${lx}px, ${ly}px)` }}
          >
            {name}
          </span>
        )}
      </div>
    );
  },
);
LiveCursor.displayName = 'LiveCursor';
