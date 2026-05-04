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
import { clamp01, clampHue, hsvToHex, type HSV } from '../ColorExtensions';

export type ColorChannel = 'hue' | 'saturation' | 'value' | 'alpha';

export interface ColorSliderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'color'> {
  channel?: ColorChannel;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  color?: HSV;
  step?: number;
  disabled?: boolean;
  'aria-label'?: string;
}

function channelMax(channel: ColorChannel): number {
  return channel === 'hue' ? 360 : 1;
}

function defaultStep(channel: ColorChannel): number {
  return channel === 'hue' ? 1 : 0.01;
}

function buildGradient(channel: ColorChannel, color: HSV | undefined): string {
  if (channel === 'hue') {
    return 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))';
  }
  const ctx: HSV = color ?? { h: 0, s: 1, v: 1 };
  if (channel === 'saturation') {
    const start = hsvToHex({ h: ctx.h, s: 0, v: ctx.v });
    const end = hsvToHex({ h: ctx.h, s: 1, v: ctx.v });
    return `linear-gradient(to right, ${start}, ${end})`;
  }
  if (channel === 'value') {
    const end = hsvToHex({ h: ctx.h, s: ctx.s, v: 1 });
    return `linear-gradient(to right, #000000, ${end})`;
  }
  // alpha
  const opaque = hsvToHex({ h: ctx.h, s: ctx.s, v: ctx.v });
  return `linear-gradient(to right, transparent, ${opaque})`;
}

const CHECKERBOARD: CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
};

export const ColorSlider = forwardRef<HTMLDivElement, ColorSliderProps>(function ColorSlider(
  {
    channel = 'hue',
    value,
    defaultValue,
    onChange,
    color,
    step,
    disabled = false,
    className,
    'aria-label': ariaLabel,
    ...rest
  },
  forwardedRef,
) {
  const max = channelMax(channel);
  const stepValue = step ?? defaultStep(channel);
  const [val, setVal] = useControlled<number>({
    controlled: value,
    default: defaultValue ?? 0,
    onChange,
  });

  const trackRef = useRef<HTMLDivElement | null>(null);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = clamp01((clientX - rect.left) / rect.width);
      const next = ratio * max;
      setVal(channel === 'hue' ? clampHue(next) : clamp01(next));
    },
    [channel, max, setVal],
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      updateFromClientX(e.clientX);
    },
    [disabled, updateFromClientX],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.buttons !== 1) return;
      updateFromClientX(e.clientX);
    },
    [disabled, updateFromClientX],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      let next = val;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          next = val + stepValue;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          next = val - stepValue;
          break;
        case 'PageUp':
          next = val + stepValue * 10;
          break;
        case 'PageDown':
          next = val - stepValue * 10;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = max;
          break;
        default:
          return;
      }
      e.preventDefault();
      setVal(channel === 'hue' ? clampHue(next) : clamp01(next));
    },
    [channel, disabled, max, setVal, stepValue, val],
  );

  const ratio = channel === 'hue' ? clampHue(val) / 360 : clamp01(val);
  const gradient = buildGradient(channel, color);
  const trackStyle: CSSProperties = {
    backgroundImage: gradient,
    ...(channel === 'alpha' ? { backgroundColor: 'transparent' } : null),
  };

  return (
    <div
      ref={forwardedRef}
      className={cn('relative inline-flex w-full select-none items-center', className)}
      {...rest}
    >
      {channel === 'alpha' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={CHECKERBOARD}
        />
      )}
      <div
        ref={composeRefs(trackRef)}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? `${channel} slider`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(val * 100) / 100}
        aria-disabled={disabled || undefined}
        aria-orientation="horizontal"
        data-disabled={disabled ? '' : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        style={trackStyle}
        className={cn(
          'relative h-3 w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow-md ring-1 ring-black/20"
          style={{ left: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
});
