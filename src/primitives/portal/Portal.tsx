import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: ReactNode;
  /** Container to render into. Default: `document.body`. */
  container?: HTMLElement | null;
  /** Optional named layer — sets `data-portal-name` on the wrapper. */
  name?: string;
}

/**
 * Render children into a different DOM node (default `document.body`).
 * Client-only — package targets pure CSR consumers.
 */
export function Portal({ children, container, name }: PortalProps): ReactNode {
  const target = container ?? document.body;
  return createPortal(<div data-portal-name={name}>{children}</div>, target);
}
