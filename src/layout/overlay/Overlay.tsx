import {
  forwardRef,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  cn,
  CssExtensions,
  TransitionExtensions,
  type SizeValue,
  type AbsolutePosition,
  type AbsolutePositionPreset,
  type AbsoluteInsetOverrides,
  type PresenceAnimationDurationProp,
} from '../../utils';
import { Slot, Presence } from '../../primitives';
import { overlayVariants } from './Overlay.variants';

const COMPONENT_NAME = 'Overlay';

/* Re-exported for ergonomic consumer imports — same shape as the shared types. */
export type OverlayPosition = AbsolutePosition;
export type OverlayAppearOn = 'always' | 'hover' | 'focus-within';
export type OverlayTransition =
  | 'none'
  | 'fade'
  | 'fade-scale'
  | 'fade-slide-up'
  | 'fade-slide-down'
  | 'fade-slide-left'
  | 'fade-slide-right';
export type OverlayDuration = PresenceAnimationDurationProp;

export interface OverlayProps {
  /* Anchor location — preset corner/edge/center, or raw inset object. Default 'top-right'. */
  position?: OverlayPosition;

  /* Spacing from edge for preset positions. Default '0.5rem'. Ignored for custom inset object. */
  inset?: SizeValue;

  /* z-index. Default 10. */
  zIndex?: number | string;

  /* Visibility trigger while mounted. Default 'always'. Hover / focus-within modes require parent `className="group"`. */
  appearOn?: OverlayAppearOn;

  /* Optional presence — when provided, controls mount/unmount with exit transition (defers unmount until transitionend). */
  isOpen?: boolean;

  /* Animation effect for show/hide. Defaults to 'fade' if any visibility gating is active, else 'none'. */
  transition?: OverlayTransition;

  /* Duration in ms. Number = symmetric; object = asymmetric enter/exit. Default 200. */
  transitionDuration?: OverlayDuration;

  /* CSS timing function. Default 'ease-out'. */
  transitionEasing?: string;

  /* Render as the single child element via Slot (no extra wrapper div). Default true. */
  asChild?: boolean;

  /* Extra classes merged onto the rendered element (or wrapper when asChild=false). */
  className?: string;

  /* Extra inline styles merged onto the rendered element. */
  style?: CSSProperties;

  /* Single React element when asChild=true (default), or arbitrary content when asChild=false. */
  children: ReactNode;
}

/* Renders a positioned overlay anchored to its nearest positioned ancestor — for image-corner controls, badges, hover-revealed actions, and conditionally mounted floating elements. */
export const Overlay = forwardRef<HTMLElement, OverlayProps>(
  (
    {
      position = 'top-right',
      inset,
      zIndex = 10,
      appearOn = 'always',
      isOpen,
      transition,
      transitionDuration,
      transitionEasing,
      asChild = true,
      className,
      style,
      children,
    },
    forwardedRef,
  ) => {
    const isPresenceMode = isOpen !== undefined;
    const isCustomPosition = typeof position === 'object' && position !== null;

    const effectiveTransition: OverlayTransition =
      transition ??
      (isPresenceMode || appearOn !== 'always' ? 'fade' : 'none');

    const visibilityMode: 'always' | 'hover' | 'focus-within' | 'presence' =
      isPresenceMode
        ? 'presence'
        : appearOn === 'hover'
          ? 'hover'
          : appearOn === 'focus-within'
            ? 'focus-within'
            : 'always';

    const { enter, exit } = TransitionExtensions.resolveDuration(transitionDuration);

    const inlineStyle: CSSProperties & Record<string, string | number> = {
      ...style,
      zIndex,
      // CSS vars consumed by tailwind variants — exit is the baseline
      // transition-duration; enter overrides it on hover / focus-within / open.
      ['--ui-overlay-enter' as string]: `${enter}ms`,
      ['--ui-overlay-exit' as string]: `${exit}ms`,
    };

    if (inset !== undefined) {
      inlineStyle['--ui-overlay-inset'] = CssExtensions.toCss(inset);
    }

    if (transitionEasing) {
      inlineStyle.transitionTimingFunction = transitionEasing;
    }

    if (isCustomPosition) {
      const p = position as AbsoluteInsetOverrides;
      if (p.top    !== undefined) inlineStyle.top    = CssExtensions.toCss(p.top);
      if (p.right  !== undefined) inlineStyle.right  = CssExtensions.toCss(p.right);
      if (p.bottom !== undefined) inlineStyle.bottom = CssExtensions.toCss(p.bottom);
      if (p.left   !== undefined) inlineStyle.left   = CssExtensions.toCss(p.left);
    }

    const classes = cn(
      overlayVariants({
        position: isCustomPosition ? 'custom' : (position as AbsolutePositionPreset),
        visibilityMode,
        transition: effectiveTransition,
      }),
      className,
    );

    const renderRoot = (extra?: Record<string, unknown>): ReactElement | null => {
      if (asChild) {
        if (!isValidElement(children)) return null;
        return (
          <Slot
            ref={forwardedRef as Ref<HTMLElement>}
            className={classes}
            style={inlineStyle}
            {...extra}
          >
            {children}
          </Slot>
        );
      }
      return (
        <div
          ref={forwardedRef as Ref<HTMLDivElement>}
          className={classes}
          style={inlineStyle}
          {...extra}
        >
          {children}
        </div>
      );
    };

    if (isPresenceMode) {
      const root = renderRoot();
      if (!root) return null;
      return <Presence isPresent={isOpen}>{root}</Presence>;
    }

    return renderRoot();
  },
);

Overlay.displayName = COMPONENT_NAME;
