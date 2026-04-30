import {
  autoUpdate,
  flip,
  offset as offsetMiddleware,
  shift,
  useFloating,
  type Placement,
} from '@floating-ui/react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { composeRefs } from '../../utils/composeRefs';

export interface AnchoredPositionerProps extends HTMLAttributes<HTMLDivElement> {
  /** The element the floating layer should be anchored to. */
  anchor: HTMLElement | null;
  /** Floating UI placement. Default `bottom`. */
  placement?: Placement;
  /** Distance between anchor and floating element in px. Default 8. */
  offset?: number;
  /** Render the floating element only when open. */
  open?: boolean;
  children: ReactNode;
}

/**
 * Position children relative to an anchor element using Floating UI.
 * Auto-flips and shifts to stay in viewport. Use as the positioning surface
 * for Tooltip, Popover, Menu, HoverCard.
 */
export const AnchoredPositioner = forwardRef<HTMLDivElement, AnchoredPositionerProps>(
  (
    { anchor, placement = 'bottom', offset = 8, open = true, children, style, ...props },
    forwardedRef,
  ) => {
    const { refs, floatingStyles } = useFloating({
      open,
      placement,
      middleware: [offsetMiddleware(offset), flip(), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
      elements: { reference: anchor },
    });

    if (!open) return null;

    return (
      <div
        ref={composeRefs(forwardedRef, refs.setFloating)}
        style={{ ...floatingStyles, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
AnchoredPositioner.displayName = 'AnchoredPositioner';
