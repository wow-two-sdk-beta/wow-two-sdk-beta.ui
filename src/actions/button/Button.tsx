import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  cn,
  resolvePaddingStyle,
  resolveRadiusStyle,
  resolveBoxSizeStyle,
  type PaddingProp,
  type RadiusProp,
  type SizeValue,
} from '../../utils';
import { Slot } from '../../primitives';
import { Spinner } from '../../icons';
import { buttonVariants, type ButtonVariants } from './Button.variants';

/** Foundational interactive element — see Button.standard.md + Button.spec.md. */

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

    const Comp = asChild ? Slot : 'button';

    const overrideStyle: CSSProperties | undefined = (() => {
      const padStyle = resolvePaddingStyle(padding);
      const radStyle = resolveRadiusStyle(radius);
      const boxStyle = resolveBoxSizeStyle({ width, height, minWidth, minHeight });
      if (!padStyle && !radStyle && !boxStyle && !style) return undefined;
      return { ...padStyle, ...radStyle, ...boxStyle, ...style };
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
