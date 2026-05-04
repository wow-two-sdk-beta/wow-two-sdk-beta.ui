import {
  forwardRef,
  useCallback,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';

export type KnobTone = 'brand' | 'success' | 'warning' | 'danger' | 'muted';

const TONE_CLASS: Record<KnobTone, string> = {
  brand: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
};

export interface KnobProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
  size?: number;
  arcDegrees?: number;
  tone?: KnobTone;
  format?: (value: number) => ReactNode;
  showValue?: boolean;
  disabled?: boolean;
  name?: string;
  'aria-label'?: string;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Rotational dial input. Pointer drag rotates over `arcDegrees` (default 270°
 * from -135° to +135°). Wheel + arrow keys step; Home/End → min/max.
 */
export const Knob = forwardRef<HTMLDivElement, KnobProps>(function Knob(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    min = 0,
    max = 1,
    step = 0.01,
    largeStep = 0.1,
    size = 64,
    arcDegrees = 270,
    tone = 'brand',
    format = (v) => v.toFixed(2),
    showValue = true,
    disabled,
    name,
    className,
    'aria-label': ariaLabel = 'Knob',
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? min,
    onChange: onValueChange,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ startY: number; startValue: number } | null>(null);

  const fraction = (clamp(value, min, max) - min) / (max - min);
  const halfArc = arcDegrees / 2;
  const startAngle = -halfArc - 90; // -90 puts 0° at top
  const endAngle = halfArc - 90;
  const angle = startAngle + fraction * arcDegrees;

  const setClamped = useCallback(
    (v: number) => setValue(clamp(v, min, max)),
    [min, max, setValue],
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    dragStateRef.current = { startY: e.clientY, startValue: value };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || !dragStateRef.current) return;
    const dy = dragStateRef.current.startY - e.clientY; // up = increase
    const range = max - min;
    const sensitivity = range / 200; // 200px drag = full range
    setClamped(dragStateRef.current.startValue + dy * sensitivity);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    setClamped(value + delta);
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const s = e.shiftKey ? largeStep : step;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        e.preventDefault();
        setClamped(value + s);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        e.preventDefault();
        setClamped(value - s);
        break;
      case 'Home':
        e.preventDefault();
        setClamped(min);
        break;
      case 'End':
        e.preventDefault();
        setClamped(max);
        break;
    }
  };

  // SVG arc path math.
  const radius = size / 2 - 4;
  const center = size / 2;
  const polar = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return [center + r * Math.cos(rad), center + r * Math.sin(rad)] as const;
  };
  const [trackStartX, trackStartY] = polar(startAngle, radius);
  const [trackEndX, trackEndY] = polar(endAngle, radius);
  const largeArc = arcDegrees > 180 ? 1 : 0;
  const trackPath = `M ${trackStartX} ${trackStartY} A ${radius} ${radius} 0 ${largeArc} 1 ${trackEndX} ${trackEndY}`;

  const [valueEndX, valueEndY] = polar(angle, radius);
  const valueLargeArc = fraction * arcDegrees > 180 ? 1 : 0;
  const valuePath = `M ${trackStartX} ${trackStartY} A ${radius} ${radius} 0 ${valueLargeArc} 1 ${valueEndX} ${valueEndY}`;

  const [pointerInnerX, pointerInnerY] = polar(angle, radius * 0.45);
  const [pointerOuterX, pointerOuterY] = polar(angle, radius * 0.85);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-orientation="vertical"
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKey}
      style={{ width: size, height: size, touchAction: 'none' }}
      className={cn(
        'relative inline-flex select-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        TONE_CLASS[tone],
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing',
        className,
      )}
      {...rest}
    >
      <svg width={size} height={size} className="overflow-visible">
        <path
          d={trackPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          className="opacity-20"
        />
        <path
          d={valuePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <line
          x1={pointerInnerX}
          y1={pointerInnerY}
          x2={pointerOuterX}
          y2={pointerOuterY}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center text-[10px] font-medium tabular-nums text-foreground"
        >
          {format(value)}
        </span>
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
});
