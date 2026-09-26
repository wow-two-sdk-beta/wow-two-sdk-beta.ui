import {
  forwardRef,
  useCallback,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useControlled } from '../../../foundation/hooks';
import { cn, composeRefs } from '../../../foundation/utils';

export interface PointControlValue {
  x: number;
  y: number;
}

export interface PointControlProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  value?: PointControlValue;
  defaultValue?: PointControlValue;
  onValueChange?: (value: PointControlValue) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  step?: number;
  isDisabled?: boolean;
  backgroundImage?: string;
  'aria-label': string;
}

const DEFAULT_VALUE: PointControlValue = { x: 0.5, y: 0.5 };

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Selects a normalized x/y point with pointer, touch, or keyboard input. */
export const PointControl = forwardRef<HTMLDivElement, PointControlProps>(function PointControl(
  {
    value,
    defaultValue = DEFAULT_VALUE,
    onValueChange,
    onInteractionStart,
    onInteractionEnd,
    step = 0.01,
    isDisabled = false,
    backgroundImage,
    className,
    style,
    'aria-label': ariaLabel,
    ...rest
  },
  forwardedRef,
) {
  const [point, setPoint] = useControlled<PointControlValue>({
    controlled: value,
    default: defaultValue,
  });
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  const emit = useCallback(
    (next: PointControlValue) => {
      const bounded = { x: clamp(next.x), y: clamp(next.y) };
      setPoint(bounded);
      onValueChange?.(bounded);
    },
    [onValueChange, setPoint],
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const bounds = surfaceRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;
      emit({
        x: (clientX - bounds.left) / bounds.width,
        y: (clientY - bounds.top) / bounds.height,
      });
    },
    [emit],
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (isDisabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onInteractionStart?.();
    updateFromPointer(event.clientX, event.clientY);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event.clientX, event.clientY);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event.clientX, event.clientY);
    event.currentTarget.releasePointerCapture(event.pointerId);
    onInteractionEnd?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (isDisabled) return;
    const amount = event.shiftKey ? step * 10 : step;
    let next = point;
    if (event.key === 'ArrowLeft') next = { ...point, x: point.x - amount };
    else if (event.key === 'ArrowRight') next = { ...point, x: point.x + amount };
    else if (event.key === 'ArrowUp') next = { ...point, y: point.y - amount };
    else if (event.key === 'ArrowDown') next = { ...point, y: point.y + amount };
    else if (event.key === 'Home') next = { x: 0, y: 0 };
    else if (event.key === 'End') next = { x: 1, y: 1 };
    else return;
    event.preventDefault();
    if (!event.repeat) onInteractionStart?.();
    emit(next);
  }

  const mergedStyle: CSSProperties = {
    ...style,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : style?.backgroundImage,
  };

  return (
    <div
      ref={composeRefs(forwardedRef, surfaceRef)}
      role="slider"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuetext={`x ${(point.x * 100).toFixed(0)}%, y ${(point.y * 100).toFixed(0)}%`}
      aria-disabled={isDisabled || undefined}
      data-disabled={isDisabled ? '' : undefined}
      className={cn(
        'relative aspect-square w-full touch-none select-none overflow-hidden rounded-md border border-border bg-cover bg-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDisabled && 'pointer-events-none opacity-50',
        className,
      )}
      style={mergedStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={() => onInteractionEnd?.()}
      onKeyDown={handleKeyDown}
      onKeyUp={onInteractionEnd}
      onBlur={onInteractionEnd}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-md ring-1 ring-black/20"
        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
      />
    </div>
  );
});

PointControl.displayName = 'PointControl';
