import {
  forwardRef,
  useCallback,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { clampHue } from '../ColorExtensions';

export interface ColorWheelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: number;
  defaultValue?: number;
  onChange?: (hue: number) => void;
  size?: number;
  thickness?: number;
  step?: number;
  disabled?: boolean;
  'aria-label'?: string;
}

function angleFromCenter(clientX: number, clientY: number, rect: DOMRect): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (angle + 360) % 360;
}

export const ColorWheel = forwardRef<HTMLDivElement, ColorWheelProps>(function ColorWheel(
  {
    value,
    defaultValue,
    onChange,
    size = 200,
    thickness = 30,
    step = 1,
    disabled = false,
    className,
    'aria-label': ariaLabel = 'Hue',
    ...rest
  },
  forwardedRef,
) {
  const [hue, setHue] = useControlled<number>({
    controlled: value,
    default: defaultValue ?? 0,
    onChange,
  });
  const trackRef = useRef<HTMLDivElement | null>(null);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      setHue(clampHue(angleFromCenter(clientX, clientY, track.getBoundingClientRect())));
    },
    [setHue],
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      updateFromClient(e.clientX, e.clientY);
    },
    [disabled, updateFromClient],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || e.buttons !== 1) return;
      updateFromClient(e.clientX, e.clientY);
    },
    [disabled, updateFromClient],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      let next = hue;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = hue + step;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = hue - step;
          break;
        case 'PageUp':
          next = hue + step * 10;
          break;
        case 'PageDown':
          next = hue - step * 10;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = 359;
          break;
        default:
          return;
      }
      e.preventDefault();
      setHue(clampHue(next));
    },
    [disabled, hue, setHue, step],
  );

  const radius = (size - thickness) / 2;
  const angleRad = (hue * Math.PI) / 180;
  const thumbX = size / 2 + radius * Math.sin(angleRad);
  const thumbY = size / 2 - radius * Math.cos(angleRad);

  const wheelStyle: CSSProperties = {
    width: size,
    height: size,
    background: 'conic-gradient(from 0deg, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
    WebkitMaskImage: `radial-gradient(circle, transparent ${(radius - thickness / 2)}px, black ${(radius - thickness / 2 + 1)}px, black ${(radius + thickness / 2)}px, transparent ${(radius + thickness / 2 + 1)}px)`,
    maskImage: `radial-gradient(circle, transparent ${(radius - thickness / 2)}px, black ${(radius - thickness / 2 + 1)}px, black ${(radius + thickness / 2)}px, transparent ${(radius + thickness / 2 + 1)}px)`,
  };

  return (
    <div
      ref={composeRefs(forwardedRef, trackRef)}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? '' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      style={wheelStyle}
      className={cn(
        'relative inline-block select-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      {...rest}
    >
      <div
        aria-hidden="true"
        style={{
          left: thumbX,
          top: thumbY,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
        }}
        className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/30"
      />
    </div>
  );
});
