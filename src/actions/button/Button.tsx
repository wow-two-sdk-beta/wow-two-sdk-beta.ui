import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { Slot } from '../../primitives';
import { buttonVariants, type ButtonVariants } from './Button.variants';

/**
 * Button — see `Button.standard.md` (behavioral contract) + `Button.spec.md` (API).
 *
 * Two-axis style (`variant` × `tone`), 5 sizes, density-scaled spacing,
 * polymorphism via `asChild` (Slot), `data-state` for observable state,
 * inlined spinner for `loading`, dimension-preserving `skeleton`,
 * forced-colors + reduced-motion handled in variants.
 *
 * Press detection / long-press / debounce are spec'd as planned (post-v1).
 */

export type PaddingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type RadiusToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type SizeValue = string | number;

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
  padding?: PaddingToken | { x?: SizeValue; y?: SizeValue };
  /** Independent radius override (preset or raw value). */
  radius?: RadiusToken | SizeValue;
  /** Default `'button'` — NOT browser-default `'submit'`. */
  type?: 'button' | 'submit' | 'reset';
}

const PADDING_TOKEN_TO_CSS: Record<Exclude<PaddingToken, 'none'>, string> = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

const RADIUS_TOKEN_TO_CSS: Record<Exclude<RadiusToken, 'none' | 'full'>, string> = {
  xs: '0.125rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
};

function sizeValueToCss(v: SizeValue): string {
  return typeof v === 'number' ? `${v}px` : v;
}

function resolvePaddingStyle(padding: ButtonProps['padding']): CSSProperties | undefined {
  if (!padding) return undefined;
  if (typeof padding === 'string') {
    if (padding === 'none') {
      return { paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 };
    }
    const v = PADDING_TOKEN_TO_CSS[padding];
    return { paddingLeft: v, paddingRight: v, paddingTop: v, paddingBottom: v };
  }
  const style: CSSProperties = {};
  if (padding.x !== undefined) {
    const v = sizeValueToCss(padding.x);
    style.paddingLeft = v;
    style.paddingRight = v;
  }
  if (padding.y !== undefined) {
    const v = sizeValueToCss(padding.y);
    style.paddingTop = v;
    style.paddingBottom = v;
  }
  return style;
}

function resolveRadiusStyle(radius: ButtonProps['radius']): CSSProperties | undefined {
  if (radius === undefined || radius === null) return undefined;
  if (typeof radius === 'number') return { borderRadius: `${radius}px` };
  if (radius === 'none') return { borderRadius: 0 };
  if (radius === 'full') return { borderRadius: '9999px' };
  if (radius in RADIUS_TOKEN_TO_CSS) {
    return {
      borderRadius:
        RADIUS_TOKEN_TO_CSS[radius as Exclude<RadiusToken, 'none' | 'full'>],
    };
  }
  // Raw CSS unit string (e.g. "20px", "1rem")
  return { borderRadius: radius };
}

/**
 * Inlined spinner — kept inside Button to preserve atom self-containment.
 * `currentColor` so it inherits tone.
 */
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
    width="1em"
    height="1em"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

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
      ...rest
    },
    ref,
  ) => {
    if (loading && skeleton) {
      console.warn(
        '[Button] `loading` and `skeleton` are mutually exclusive — `skeleton` takes precedence.',
      );
    }
    const isSkeleton = !!skeleton;
    const isLoading = !isSkeleton && !!loading;

    const dataState: 'loading' | 'skeleton' | 'disabled' | undefined = isSkeleton
      ? 'skeleton'
      : isLoading
        ? 'loading'
        : disabled
          ? 'disabled'
          : undefined;

    const Comp: typeof Slot | 'button' = asChild ? Slot : 'button';

    const overrideStyle: CSSProperties | undefined = (() => {
      const padStyle = resolvePaddingStyle(padding);
      const radStyle = resolveRadiusStyle(radius);
      if (!padStyle && !radStyle && !style) return undefined;
      return { ...padStyle, ...radStyle, ...style };
    })();

    const handleClick = isLoading || isSkeleton ? undefined : onClick;

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
        disabled={disabled || undefined}
        aria-busy={isLoading || isSkeleton ? true : undefined}
        tabIndex={isSkeleton ? -1 : undefined}
        data-state={dataState}
        onClick={handleClick}
        {...rest}
      >
        {content}
      </Comp>
    );
  },
);

Button.displayName = 'Button';
