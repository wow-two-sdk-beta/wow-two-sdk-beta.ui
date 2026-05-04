import {
  forwardRef,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { cn } from '../../utils';

export interface TiltProps extends HTMLAttributes<HTMLElement> {
  maxAngle?: number;
  perspective?: number;
  glare?: boolean;
  scale?: number;
  as?: 'div' | 'section' | 'article' | 'span';
}

interface TiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
  active: boolean;
}

/**
 * 3D card tilt — `rotateX`/`rotateY` from cursor position. Disabled under
 * `prefers-reduced-motion`. Optional `glare` paints a soft highlight that
 * follows the cursor.
 */
export const Tilt = forwardRef<HTMLElement, TiltProps>(function Tilt(
  {
    maxAngle = 12,
    perspective = 800,
    glare,
    scale = 1,
    as = 'div',
    className,
    style,
    children,
    onPointerMove,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const elRef = useRef<HTMLElement | null>(null);
  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    active: false,
  });

  const reduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const handleMove = (e: ReactPointerEvent<HTMLElement>) => {
    onPointerMove?.(e);
    if (reduced) return;
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 2 * maxAngle;
    const rotateX = (0.5 - y) * 2 * maxAngle;
    setTilt({ rotateX, rotateY, glareX: x * 100, glareY: y * 100, active: true });
  };

  const handleLeave = (e: ReactPointerEvent<HTMLElement>) => {
    onPointerLeave?.(e);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, active: false });
  };

  const Tag = as as ElementType;
  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        elRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn('relative', className)}
      style={{
        perspective,
        transform: tilt.active && !reduced
          ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${scale})`
          : 'rotateX(0) rotateY(0) scale(1)',
        transition: tilt.active ? 'transform 80ms ease-out' : 'transform 220ms ease-out',
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...rest}
    >
      {children}
      {glare && !reduced && tilt.active && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.35) 0%, transparent 50%)`,
          }}
        />
      )}
    </Tag>
  );
});
