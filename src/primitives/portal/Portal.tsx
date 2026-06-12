import { useEffect, useState, type ReactNode } from 'react';
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
 * SSR-inert — renders nothing on the server, portals in after mount on the client.
 */
export function Portal({ children, container, name }: PortalProps): ReactNode {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const target = container ?? document.body;
  return createPortal(<div data-portal-name={name}>{children}</div>, target);
}
