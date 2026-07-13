import { useCallback, useState } from 'react';

export interface DisclosureControls {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (next: boolean) => void;
}

/**
 * Minimal open/close state with stable callbacks. The standard backbone for
 * Modal, Drawer, Popover, Menu, Accordion, etc. Use `useControlled` underneath
 * when the consumer may also pass a controlled `open` prop.
 */
export function useDisclosure(initial = false): DisclosureControls {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  return { isOpen, open, close, toggle, setOpen: setIsOpen };
}
