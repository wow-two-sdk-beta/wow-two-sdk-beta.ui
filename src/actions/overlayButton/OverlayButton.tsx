import { forwardRef } from 'react';
import { cn } from '../../utils';
import { Button, type ButtonProps } from '../button/Button';

/**
 * OverlayButton — thin wrapper around Button, supplying the typical
 * "icon-button glassy circle anchored over a card/image" preset.
 *
 * Glass styling, sizing, loading/skeleton, asChild, etc. all flow from Button.
 * OverlayButton owns positioning + reveal-on-hover only.
 *
 * Pair with `appearOn="hover"` and a parent with `className="group"` to
 * reveal the button only when the parent is hovered.
 */

export type OverlayPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'center';

export type OverlayAppearOn = 'always' | 'hover';

export interface OverlayButtonProps
  extends Omit<ButtonProps, 'variant' | 'shape'> {
  /** Anchor location relative to the positioned parent. Default `'top-right'`. */
  position?: OverlayPosition;
  /**
   * Visibility — `'always'` shows on mount; `'hover'` reveals when the parent
   * (which MUST have `className="group"`) is hovered. Default `'always'`.
   */
  appearOn?: OverlayAppearOn;
  /** REQUIRED — overlay buttons are typically icon-only. */
  'aria-label': string;
}

const POSITION_CLASSES: Record<OverlayPosition, string> = {
  'top-right':    'absolute top-2 right-2',
  'top-left':     'absolute top-2 left-2',
  'bottom-right': 'absolute bottom-2 right-2',
  'bottom-left':  'absolute bottom-2 left-2',
  'center':       'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

const APPEAR_ON_CLASSES: Record<OverlayAppearOn, string> = {
  always: 'opacity-100',
  hover:  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity',
};

export const OverlayButton = forwardRef<HTMLButtonElement, OverlayButtonProps>(
  (
    {
      className,
      position = 'top-right',
      appearOn = 'always',
      size = 'sm',
      tone = 'neutral',
      ...props
    },
    ref,
  ) => (
    <Button
      ref={ref}
      variant="glass"
      shape="circle"
      size={size}
      tone={tone}
      className={cn(
        POSITION_CLASSES[position],
        APPEAR_ON_CLASSES[appearOn],
        'z-10',
        className,
      )}
      {...props}
    />
  ),
);

OverlayButton.displayName = 'OverlayButton';
