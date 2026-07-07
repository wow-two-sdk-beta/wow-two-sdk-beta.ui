import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
  type PointerEvent,
  type PointerEventHandler,
  type ReactNode,
} from 'react';
import {
  cn,
  ColorExtensions,
  composeEventHandlers,
  ButtonType,
  CssExtensions,
  HtmlElement,
  IS_DEV,
  Key,
  OptionalExtensions,
  PressExtensions,
  type BoxSizeOverrides,
  type ColorProp,
  type ColorTone,
  type PaddingProp,
  type PressEvent,
  type RadiusProp,
  type SizePreset,
  type SizeUnion,
  type SizeValue,
} from '../../../foundation/utils';
import { Slot } from '../../../foundation/primitives';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Spinner } from '../../../foundation/icons';
import { useDebounceHandler } from '../../../foundation/hooks';
import {
  buttonVariants,
  type ButtonVariant,
  type ButtonShape,
  type ButtonVariants,
} from './Button.variants';

const COMPONENT_NAME = 'Button';

/* Named size presets — used for variant lookup. Any other string/number/object flows to box-overrides. Subset of the canonical `SizePreset` vocabulary. */
type ButtonSizePreset = Extract<SizePreset, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
const BUTTON_SIZE_PRESETS: ReadonlySet<string> = new Set<ButtonSizePreset>(['xs', 'sm', 'md', 'lg', 'xl']);

/* `size`: preset (variant class) | number/string (square inline dims) | `{width,height,minWidth,minHeight,boxSize}`.
   Raw/object forms set inline dims only — pair with `padding` if text-bearing. */
export type ButtonSize = SizeUnion<ButtonSizePreset>;

/* Observable state surfaced via the `data-state` DOM attribute. */
const ButtonDataState = {
  Loading: 'loading',
  Skeleton: 'skeleton',
  Disabled: 'disabled',
} as const;
type ButtonDataState = (typeof ButtonDataState)[keyof typeof ButtonDataState];

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled' | 'color'>,
    Omit<ButtonVariants, 'size' | 'variant' | 'tone' | 'shape'> {
  /** The visual surface style. */
  variant?: ButtonVariant;

  /** The semantic tone palette. */
  tone?: ColorTone;

  /** The button silhouette (default · square · circle). */
  shape?: ButtonShape;

  /** The size — preset name OR raw value OR explicit dim object; see `ButtonSize` for details. */
  size?: ButtonSize;

  /** The per-instance color override for the active `tone`. String → all slots derived; object → per-slot (bg/text/soft/softText/ring). Sets local CSS vars that `bg-{tone}` etc. pick up. */
  color?: ColorProp;

  /** The slot before children (logical start). */
  leadingSlot?: ReactNode;

  /** The slot after children (logical end). */
  trailingSlot?: ReactNode;

  /** The content shown in place of `children` on hover / focus-visible (CSS-only swap — no JS hover state).
     Idle → `children` visible; hover/focus-visible → `hoverSlot` visible. Pairs with `variant="reveal"`
     for a reveal-on-hover icon swap. When undefined, `children` renders normally. */
  hoverSlot?: ReactNode;

  /** The indicator shown in place of the built-in `<Spinner/>` when `isLoading` is true. */
  loadingSlot?: ReactNode;

  /** The action-loading state — replaces leading w/ spinner, sets aria-busy, blocks clicks. */
  isLoading?: boolean;

  /** The text that replaces children when loading. No default — consumer supplies (i18n). */
  loadingText?: string;

  /** The content-loading state — hides content (preserves dimensions) + shimmer. Mutually exclusive with `isLoading`. */
  isSkeleton?: boolean;

  /** The disabled state — removes from focus order, blocks clicks. Forwards to native `disabled`. Inherited from an enclosing `Field` when omitted. */
  isDisabled?: boolean;

  /** The full-width state — stretches to fill container width. */
  isFullWidth?: boolean;

  /** The multi-line state — allows label wrap; default truncates to single line. */
  isMultiline?: boolean;

  /** The as-child flag — renders as the single child element via Slot. */
  asChild?: boolean;

  /** The independent padding override (preset token or `{x, y}` object). */
  padding?: PaddingProp;

  /** The independent radius override (preset token or raw value). */
  radius?: RadiusProp;

  /** The explicit width override. Number = px; string = any CSS unit. */
  width?: SizeValue;

  /** The explicit height override. Number = px; string = any CSS unit. */
  height?: SizeValue;

  /** The min width reserved so the button doesn't reflow when its label morphs. */
  minWidth?: SizeValue;

  /** The min height reserved — symmetric with `minWidth`. */
  minHeight?: SizeValue;

  /** The square-size shorthand — applied as fallback for both `width` and `height`. Explicit `width`/`height` win when both are set. Pairs with `shape="square"` / `shape="circle"` for icon buttons. */
  boxSize?: SizeValue;

  /** The button type. Default `ButtonType.Button` — NOT browser-default `'submit'`. */
  type?: ButtonType;

  /** Fires when the press begins — pointer-down OR Space/Enter keydown (first event in a gesture). */
  onPressStart?: (event: PressEvent<HTMLButtonElement>) => void;

  /** Fires when the press ends — pointer-up/cancel OR Space/Enter keyup. */
  onPressEnd?: (event: PressEvent<HTMLButtonElement>) => void;

  /** Fires when the pointer is held for `longPressDelay` ms. Suppresses the next click. */
  onLongPress?: (event: PointerEvent<HTMLButtonElement>) => void;

  /** The long-press duration (ms). Default 500. Out-of-range values trigger a dev warning. */
  longPressDelay?: number;

  /** The click-throttle window (ms) — first wins; subsequent swallowed via `preventDefault()`. */
  debounceMs?: number;
}

interface UseButtonInteractivityOptions {
  isInactive: boolean;
  isLoading: boolean;
  isSkeleton: boolean;
  longPressDelay: number;
  debounceMs?: number;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onPressStart?: (event: PressEvent<HTMLButtonElement>) => void;
  onPressEnd?: (event: PressEvent<HTMLButtonElement>) => void;
  onLongPress?: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
  onPointerLeave?: PointerEventHandler<HTMLButtonElement>;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  onKeyUp?: KeyboardEventHandler<HTMLButtonElement>;
}

/* Press / long-press / debounce wiring. Returns the 6 DOM event handlers for spread onto the element. */
function useButtonInteractivity(opts: UseButtonInteractivityOptions) {
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

  const endPress = (e: PressEvent<HTMLButtonElement>) => {
    if (isPressingRef.current) {
      isPressingRef.current = false;
      opts.onPressEnd?.(e);
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (opts.isInactive) return;
    // Cancel any pending timer, then arm only on the first pointer of a gesture — a second
    // pointer-down must not stack a second long-press timer.
    cancelLongPress();
    if (!isPressingRef.current) {
      isPressingRef.current = true;
      longPressFiredRef.current = false;
      opts.onPressStart?.(e);
      if (opts.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          longPressFiredRef.current = true;
          opts.onLongPress?.(e);
          longPressTimerRef.current = undefined;
        }, opts.longPressDelay);
      }
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    cancelLongPress();
    endPress(e);
  };

  const handlePointerCancel = (e: PointerEvent<HTMLButtonElement>) => {
    cancelLongPress();
    endPress(e);
  };

  const handlePointerLeave = () => {
    // Pointer leaving cancels a pending long-press but does NOT end the press itself —
    // pointer-up/cancel handlers do that. Matches React Aria.
    cancelLongPress();
  };

  const isActivationKey = (e: KeyboardEvent<HTMLButtonElement>) =>
    e.key === Key.Space || e.key === Key.Enter;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (opts.isInactive) return;
    if (isActivationKey(e) && !e.repeat && !isPressingRef.current) {
      isPressingRef.current = true;
      longPressFiredRef.current = false;
      opts.onPressStart?.(e);
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (isActivationKey(e) && isPressingRef.current) {
      isPressingRef.current = false;
      opts.onPressEnd?.(e);
    }
  };

  // Long-press suppression happens BEFORE this — a suppressed click does NOT advance the throttle window.
  const debouncedOnClick = useDebounceHandler(opts.onClick, opts.debounceMs);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (opts.isLoading || opts.isSkeleton) {
      // Block native activation too — e.g. `type="submit"` must not submit while loading.
      e.preventDefault();
      return;
    }
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      e.preventDefault();
      return;
    }
    debouncedOnClick(e);
  };

  return {
    onClick: handleClick,
    onPointerDown: composeEventHandlers(opts.onPointerDown, handlePointerDown),
    onPointerUp: composeEventHandlers(opts.onPointerUp, handlePointerUp),
    onPointerCancel: composeEventHandlers(opts.onPointerCancel, handlePointerCancel),
    onPointerLeave: composeEventHandlers(opts.onPointerLeave, handlePointerLeave),
    onKeyDown: composeEventHandlers(opts.onKeyDown, handleKeyDown),
    onKeyUp: composeEventHandlers(opts.onKeyUp, handleKeyUp),
  };
}

/* Renders an action button — for text and/or icon content. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      style,
      variant,
      tone,
      size,
      shape,
      isFullWidth,
      isMultiline,
      padding,
      radius,
      width,
      height,
      minWidth,
      minHeight,
      boxSize,
      leadingSlot,
      trailingSlot,
      hoverSlot,
      loadingSlot,
      isLoading,
      loadingText,
      isSkeleton,
      isDisabled,
      asChild,
      color,
      type = ButtonType.Button,
      children,
      onClick,
      onPressStart,
      onPressEnd,
      onLongPress,
      longPressDelay = PressExtensions.longPressDelay.default,
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
    if (IS_DEV && isLoading && isSkeleton) {
      console.warn(
        `[${COMPONENT_NAME}] \`isLoading\` and \`isSkeleton\` are mutually exclusive — \`isSkeleton\` takes precedence.`,
      );
    }

    let safeLongPressDelay = longPressDelay;
    if (
      longPressDelay < PressExtensions.longPressDelay.min ||
      longPressDelay > PressExtensions.longPressDelay.max
    ) {
      if (IS_DEV) {
        console.warn(
          `[${COMPONENT_NAME}] longPressDelay=${longPressDelay}ms is outside reasonable range (${PressExtensions.longPressDelay.min}–${PressExtensions.longPressDelay.max}ms). Falling back to ${PressExtensions.longPressDelay.default}ms.`,
        );
      }
      safeLongPressDelay = PressExtensions.longPressDelay.default;
    }

    if (
      IS_DEV &&
      (children === undefined || children === null || children === false) &&
      rest['aria-label'] === undefined &&
      rest['aria-labelledby'] === undefined
    ) {
      console.warn(
        `[${COMPONENT_NAME}] icon-only button (no text children) is missing an accessible name — pass \`aria-label\` or \`aria-labelledby\` (Button.standard.md rule 12).`,
      );
    }

    /* Inherit disabled-state from an enclosing `Field` when the local prop is omitted; standalone when no context. */
    const formControl = useFormControl();
    const resolvedDisabled = isDisabled ?? formControl?.isDisabled ?? false;

    const skeletonActive = !!isSkeleton;
    const loadingActive = !skeletonActive && !!isLoading;
    const isInactive = loadingActive || skeletonActive || resolvedDisabled;

    const dataState: ButtonDataState | undefined = skeletonActive
      ? ButtonDataState.Skeleton
      : loadingActive
        ? ButtonDataState.Loading
        : resolvedDisabled
          ? ButtonDataState.Disabled
          : undefined;

    const Comp = asChild ? Slot : HtmlElement.Button;

    /* Parse the union-typed `size` prop into preset (for variant lookup) + box overrides (for inline dims). */
    const { preset: sizePreset, box: sizeBox } = CssExtensions.parseSizeUnion<ButtonSizePreset>(
      size,
      BUTTON_SIZE_PRESETS,
    );

    const overrideStyle: CSSProperties | undefined = (() => {
      const padStyle = CssExtensions.resolvePadding(padding);
      const radStyle = CssExtensions.resolveRadius(radius);
      /* Box overrides — `size` (object form or raw value) is the base; flat width/height/minWidth/minHeight/boxSize props win when both are set. */
      const composedBox: BoxSizeOverrides = {
        ...(sizeBox ?? {}),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        ...(minWidth !== undefined ? { minWidth } : {}),
        ...(minHeight !== undefined ? { minHeight } : {}),
        ...(boxSize !== undefined ? { boxSize } : {}),
      };
      const boxStyle = CssExtensions.resolveBoxSize(composedBox);
      /* Per-instance color override → sets CSS vars on element, scoped locally. */
      const colorStyle = ColorExtensions.toneColorOverride(color, tone as ColorTone | undefined);
      if (!padStyle && !radStyle && !boxStyle && !colorStyle && !style) return undefined;
      return { ...colorStyle, ...padStyle, ...radStyle, ...boxStyle, ...style };
    })();

    const eventHandlers = useButtonInteractivity({
      isInactive,
      isLoading: loadingActive,
      isSkeleton: skeletonActive,
      longPressDelay: safeLongPressDelay,
      debounceMs,
      onClick,
      onPressStart,
      onPressEnd,
      onLongPress,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
      onKeyDown,
      onKeyUp,
    });

    const content = loadingActive ? (
      <>
        {loadingSlot ?? <Spinner />}
        {loadingText !== undefined ? (
          <span>{loadingText}</span>
        ) : (
          // No loadingText: keep children in sr-only so the accessible name survives (Spinner is aria-hidden).
          <span className="sr-only">{children}</span>
        )}
      </>
    ) : hoverSlot !== undefined ? (
      <>
        {leadingSlot}
        {/* CSS-only hover/focus-visible swap: `children` occupies the box and reserves its size;
            `hoverSlot` overlays it centered. Toggle via `group-hover`/`group-focus-visible` on the
            root `group` — no JS hover state. `aria-hidden` on the hidden layer so AT reads one label. */}
        <span className="relative inline-flex items-center justify-center">
          <span className="inline-flex items-center justify-center group-hover:invisible group-focus-visible:invisible">
            {children}
          </span>
          <span
            aria-hidden
            className="invisible absolute inset-0 inline-flex items-center justify-center group-hover:visible group-focus-visible:visible"
          >
            {hoverSlot}
          </span>
        </span>
        {trailingSlot}
      </>
    ) : (
      <>
        {leadingSlot}
        {children}
        {trailingSlot}
      </>
    );

    /* asChild → Slot merges onto the user's element; leadingSlot/trailingSlot/isLoading aren't rendered (consumer owns children). */
    const renderedContent = asChild ? children : content;

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(
          buttonVariants({
            variant,
            tone,
            size: sizePreset,
            shape,
            fullWidth: isFullWidth,
            wrap: isMultiline,
          }),
          className,
        )}
        style={overrideStyle}
        disabled={OptionalExtensions.from(resolvedDisabled, true)}
        aria-busy={OptionalExtensions.from(loadingActive || skeletonActive, true)}
        aria-disabled={OptionalExtensions.from(loadingActive || skeletonActive, true)}
        tabIndex={OptionalExtensions.from(skeletonActive, -1)}
        data-state={dataState}
        {...eventHandlers}
        {...rest}
      >
        {renderedContent}
      </Comp>
    );
  },
);

Button.displayName = COMPONENT_NAME;
