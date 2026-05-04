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
import { clamp01, hsvToHex } from '../ColorExtensions';

export interface ColorAreaChange {
  saturation: number;
  value: number;
}

export interface ColorAreaProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  hue?: number;
  saturation?: number;
  defaultSaturation?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (next: ColorAreaChange) => void;
  step?: number;
  disabled?: boolean;
  'aria-label'?: string;
}

export const ColorArea = forwardRef<HTMLDivElement, ColorAreaProps>(function ColorArea(
  {
    hue = 0,
    saturation,
    defaultSaturation,
    value,
    defaultValue,
    onChange,
    step = 0.01,
    disabled = false,
    className,
    'aria-label': ariaLabel = 'Saturation and value',
    ...rest
  },
  forwardedRef,
) {
  const [s, setS] = useControlled<number>({
    controlled: saturation,
    default: defaultSaturation ?? 1,
  });
  const [v, setV] = useControlled<number>({
    controlled: value,
    default: defaultValue ?? 1,
  });

  const trackRef = useRef<HTMLDivElement | null>(null);

  const emit = useCallback(
    (nextS: number, nextV: number) => {
      const cs = clamp01(nextS);
      const cv = clamp01(nextV);
      setS(cs);
      setV(cv);
      onChange?.({ saturation: cs, value: cv });
    },
    [onChange, setS, setV],
  );

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const xRatio = clamp01((clientX - rect.left) / rect.width);
      const yRatio = clamp01((clientY - rect.top) / rect.height);
      emit(xRatio, 1 - yRatio);
    },
    [emit],
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
      const big = step * 10;
      let nextS = s;
      let nextV = v;
      switch (e.key) {
        case 'ArrowRight':
          nextS = s + step;
          break;
        case 'ArrowLeft':
          nextS = s - step;
          break;
        case 'ArrowUp':
          nextV = v + step;
          break;
        case 'ArrowDown':
          nextV = v - step;
          break;
        case 'PageUp':
          nextV = v + big;
          break;
        case 'PageDown':
          nextV = v - big;
          break;
        case 'Home':
          nextS = 0;
          nextV = 1;
          break;
        case 'End':
          nextS = 1;
          nextV = 0;
          break;
        default:
          return;
      }
      e.preventDefault();
      emit(nextS, nextV);
    },
    [disabled, emit, s, step, v],
  );

  const baseColor = `hsl(${hue}, 100%, 50%)`;
  const trackStyle: CSSProperties = {
    backgroundImage: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, transparent)`,
    backgroundColor: baseColor,
  };

  const thumbColor = hsvToHex({ h: hue, s, v });
  const thumbStyle: CSSProperties = {
    left: `${s * 100}%`,
    top: `${(1 - v) * 100}%`,
    backgroundColor: thumbColor,
  };

  return (
    <div
      ref={composeRefs(forwardedRef, trackRef)}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuetext={`saturation ${(s * 100).toFixed(0)}%, value ${(v * 100).toFixed(0)}%`}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? '' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      style={trackStyle}
      className={cn(
        'relative aspect-square w-full select-none rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      {...rest}
    >
      <div
        aria-hidden="true"
        style={thumbStyle}
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/20"
      />
    </div>
  );
});
