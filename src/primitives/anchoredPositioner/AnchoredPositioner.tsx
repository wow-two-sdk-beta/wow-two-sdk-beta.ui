import {
  autoUpdate,
  flip,
  offset as offsetMiddleware,
  shift,
  size as sizeMiddleware,
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
 *
 * Exposes the anchor's measured size as CSS variables on the floating
 * element, enabling consumers to size content relative to the trigger:
 *
 *     style="--anchor-width: 240px; --anchor-height: 36px;"
 *
 * Common pattern: `min-w-[var(--anchor-width)]` on a Select dropdown so
 * the panel never narrows below the trigger.
 */
export const AnchoredPositioner = forwardRef<HTMLDivElement, AnchoredPositionerProps>(
  (
    { anchor, placement = 'bottom', offset = 8, open = true, children, style, ...props },
    forwardedRef,
  ) => {
    const { refs, floatingStyles } = useFloating({
      open,
      placement,
      middleware: [
        offsetMiddleware(offset),
        flip(),
        shift({ padding: 8 }),
        sizeMiddleware({
          apply({ rects, elements }) {
            elements.floating.style.setProperty('--anchor-width', `${rects.reference.width}px`);
            elements.floating.style.setProperty(
              '--anchor-height',
              `${rects.reference.height}px`,
            );
          },
        }),
      ],
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
