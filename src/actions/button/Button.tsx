import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  cn,
  composeEventHandlers,
  CssExtensions,
  OptionalExtensions,
  type PaddingProp,
  type RadiusProp,
  type SizeValue,
} from '../../utils';
import { Slot } from '../../primitives';
import { Spinner } from '../../icons';
import { useDebounceHandler } from '../../hooks';
import { buttonVariants, type ButtonVariants } from './Button.variants';

/** Foundational interactive element — see Button.standard.md + Button.spec.md. */

const LONG_PRESS_DELAY_MIN = 200;
const LONG_PRESS_DELAY_MAX = 60_000; // 1 min — accommodates hold-to-confirm patterns (e.g. 5s for destructive)
const LONG_PRESS_DELAY_DEFAULT = 500;

export type PressEvent =
  | PointerEvent<HTMLButtonElement>
  | KeyboardEvent<HTMLButtonElement>;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>,
    ButtonVariants {
  /** Slot before children (logical start). */
  leading?: ReactNode;
  /** Slot after children (logical end). */
  trailing?: ReactNode;
  /** Action-loading: replaces leading w/ spinner, sets aria-busy, blocks clicks. */
  loading?: boolean;
  /** Replaces children when loading. No default — consumer supplies (i18n). */
  loadingText?: string;
  /**
   * Content-loading: hides content (preserves box dimensions) + shimmer bg.
   * Mutually exclusive with `loading` — if both, `skeleton` wins (+ dev warn).
   */
  skeleton?: boolean;
  /** Render as the single child element via Slot. */
  asChild?: boolean;
  /** Independent padding override (preset or `{x, y}` object). */
  padding?: PaddingProp;
  /** Independent radius override (preset or raw value). */
  radius?: RadiusProp;
  /** Explicit width override. Number = px; string = any CSS unit. */
  width?: SizeValue;
  /** Explicit height override. Number = px; string = any CSS unit. */
  height?: SizeValue;
  /**
   * Reserve a minimum width so the button doesn't reflow when its label
   * changes (e.g. "Save" → "Saving…" → "Saved"). Number = px; string = any
   * CSS unit. Content stays centered via the base `justify-center`.
   */
  minWidth?: SizeValue;
  /** Reserve a minimum height — symmetric with `minWidth`. */
  minHeight?: SizeValue;
  /** Default `'button'` — NOT browser-default `'submit'`. */
  type?: 'button' | 'submit' | 'reset';
  /** Fires on pointer-down OR Space/Enter keydown (first event in a gesture). */
  onPressStart?: (event: PressEvent) => void;
  /** Fires on pointer-up/cancel OR Space/Enter keyup. */
  onPressEnd?: (event: PressEvent) => void;
  /** Fires when the pointer is held for `longPressDelay` ms. Suppresses the next click. */
  onLongPress?: (event: PointerEvent<HTMLButtonElement>) => void;
  /** Long-press duration in ms. Default 500. */
  longPressDelay?: number;
  /**
   * Throttle clicks within `debounceMs`: first click fires, subsequent within
   * the window are swallowed (functionally a throttle — kept the `debounce*`
   * naming for consumer familiarity). Skipped when `loading` or `skeleton`.
   */
  debounceMs?: number;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      style,
      variant,
      tone,
      size,
      shape,
      fullWidth,
      wrap,
      padding,
      radius,
      width,
      height,
      minWidth,
      minHeight,
      leading,
      trailing,
      loading,
      loadingText,
      skeleton,
      asChild,
      type = 'button',
      disabled,
      children,
      onClick,
      onPressStart,
      onPressEnd,
      onLongPress,
      longPressDelay = LONG_PRESS_DELAY_DEFAULT,
      debounceMs,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
      onKeyDown,
      onKeyUp,
      ...rest
    },
    ref,
  ) => {
    if (loading && skeleton) {
      console.warn(
        '[Button] `loading` and `skeleton` are mutually exclusive — `skeleton` takes precedence.',
      );
    }
    const safeLongPressDelay =
      longPressDelay < LONG_PRESS_DELAY_MIN || longPressDelay > LONG_PRESS_DELAY_MAX
        ? (console.warn(
            `[Button] longPressDelay=${longPressDelay}ms is outside reasonable range (${LONG_PRESS_DELAY_MIN}–${LONG_PRESS_DELAY_MAX}ms). Falling back to ${LONG_PRESS_DELAY_DEFAULT}ms.`,
          ),
          LONG_PRESS_DELAY_DEFAULT)
        : longPressDelay;

    const isSkeleton = !!skeleton;
    const isLoading = !isSkeleton && !!loading;
    const isInactive = isLoading || isSkeleton || !!disabled;

    const dataState: 'loading' | 'skeleton' | 'disabled' | undefined = isSkeleton
      ? 'skeleton'
      : isLoading
        ? 'loading'
        : disabled
          ? 'disabled'
          : undefined;

    const Comp = asChild ? Slot : 'button';

    const overrideStyle: CSSProperties | undefined = (() => {
      const padStyle = CssExtensions.resolvePadding(padding);
      const radStyle = CssExtensions.resolveRadius(radius);
      const boxStyle = CssExtensions.resolveBoxSize({ width, height, minWidth, minHeight });
      if (!padStyle && !radStyle && !boxStyle && !style) return undefined;
      return { ...padStyle, ...radStyle, ...boxStyle, ...style };
    })();

    // Press / long-press / debounce state
    const isPressingRef = useRef(false);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const longPressFiredRef = useRef(false);

    useEffect(
      () => () => {
        if (longPressTimerRef.current !== undefined) {
          clearTimeout(longPressTimerRef.current);
        }
      },
      [],
    );

    const cancelLongPress = () => {
      if (longPressTimerRef.current !== undefined) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = undefined;
      }
    };

    const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
      if (isInactive) return;
      if (!isPressingRef.current) {
        isPressingRef.current = true;
        longPressFiredRef.current = false;
        onPressStart?.(e);
      }
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          longPressFiredRef.current = true;
          onLongPress(e);
          longPressTimerRef.current = undefined;
        }, safeLongPressDelay);
      }
    };

    const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
      cancelLongPress();
      if (isPressingRef.current) {
        isPressingRef.current = false;
        onPressEnd?.(e);
      }
    };

    const handlePointerCancel = (e: PointerEvent<HTMLButtonElement>) => {
      cancelLongPress();
      if (isPressingRef.current) {
        isPressingRef.current = false;
        onPressEnd?.(e);
      }
    };

    const handlePointerLeave = () => {
      // Pointer leaving the button cancels a pending long-press but does NOT end the
      // press itself — pointer-up/cancel handlers do that. Matches React Aria.
      cancelLongPress();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (isInactive) return;
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !isPressingRef.current) {
        isPressingRef.current = true;
        longPressFiredRef.current = false;
        onPressStart?.(e);
      }
    };

    const handleKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === ' ' || e.key === 'Enter') && isPressingRef.current) {
        isPressingRef.current = false;
        onPressEnd?.(e);
      }
    };

    // Throttle the actual onClick via useDebounceHandler (extracted hook —
    // also usable by consumers on arbitrary handlers via the hooks barrel).
    // Wrapping just `onClick` (not the gate logic) means a long-press-suppressed
    // click does NOT advance the throttle window.
    const debouncedOnClick = useDebounceHandler(onClick, debounceMs);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (isLoading || isSkeleton) return;
      // Long-press already handled this gesture — suppress the implicit click.
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        e.preventDefault();
        return;
      }
      debouncedOnClick(e);
    };

    const content = isLoading ? (
      <>
        <Spinner />
        {loadingText !== undefined ? <span>{loadingText}</span> : children}
        {trailing}
      </>
    ) : (
      <>
        {leading}
        {children}
        {trailing}
      </>
    );

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(
          buttonVariants({ variant, tone, size, shape, fullWidth, wrap }),
          className,
        )}
        style={overrideStyle}
        disabled={OptionalExtensions.from(disabled, true)}
        aria-busy={OptionalExtensions.from(isLoading || isSkeleton, true)}
        tabIndex={OptionalExtensions.from(isSkeleton, -1)}
        data-state={dataState}
        onClick={handleClick}
        onPointerDown={composeEventHandlers(onPointerDown, handlePointerDown)}
        onPointerUp={composeEventHandlers(onPointerUp, handlePointerUp)}
        onPointerCancel={composeEventHandlers(onPointerCancel, handlePointerCancel)}
        onPointerLeave={composeEventHandlers(onPointerLeave, handlePointerLeave)}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
        onKeyUp={composeEventHandlers(onKeyUp, handleKeyUp)}
        {...rest}
      >
        {content}
      </Comp>
    );
  },
);

Button.displayName = 'Button';
