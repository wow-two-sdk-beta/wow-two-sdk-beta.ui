import {
  forwardRef,
  useEffect,
  useRef,
  type HTMLAttributes,
} from 'react';
import { composeRefs } from '../../utils/composeRefs';

interface LayerEntry {
  node: HTMLElement;
  onEscape?: (event: KeyboardEvent) => void;
  onOutsidePointerDown?: (event: PointerEvent) => void;
}

const layerStack: LayerEntry[] = [];

export interface DismissableLayerProps extends HTMLAttributes<HTMLDivElement> {
  /** Called when Escape is pressed and this is the topmost layer. */
  onEscape?: (event: KeyboardEvent) => void;
  /** Called when a pointerdown lands outside this layer's DOM and this is topmost. */
  onOutsidePointerDown?: (event: PointerEvent) => void;
  /** Disable the Escape listener for this layer. */
  disableEscape?: boolean;
  /** Disable the outside-pointer-down listener for this layer. */
  disableOutsideClick?: boolean;
}

/**
 * Stack-aware dismissal layer. Multiple layers may stack (modal > popover);
 * only the topmost reacts to Escape / outside click. Used as the base of
 * Modal, Drawer, Popover, Menu, HoverCard, ContextMenu.
 */
export const DismissableLayer = forwardRef<HTMLDivElement, DismissableLayerProps>(
  (
    { onEscape, onOutsidePointerDown, disableEscape, disableOutsideClick, ...props },
    forwardedRef,
  ) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const node = ref.current;
      if (!node) return;
      const entry: LayerEntry = { node, onEscape, onOutsidePointerDown };
      layerStack.push(entry);
      return () => {
        const idx = layerStack.indexOf(entry);
        if (idx >= 0) layerStack.splice(idx, 1);
      };
    }, [onEscape, onOutsidePointerDown]);

    useEffect(() => {
      if (disableEscape) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') return;
        const top = layerStack[layerStack.length - 1];
        if (top && top.node === ref.current) top.onEscape?.(e);
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [disableEscape]);

    useEffect(() => {
      if (disableOutsideClick) return;
      const onPointer = (e: PointerEvent) => {
        const top = layerStack[layerStack.length - 1];
        if (!top || top.node !== ref.current) return;
        const target = e.target as Node | null;
        if (!target || ref.current?.contains(target)) return;
        top.onOutsidePointerDown?.(e);
      };
      document.addEventListener('pointerdown', onPointer, true);
      return () => document.removeEventListener('pointerdown', onPointer, true);
    }, [disableOutsideClick]);

    return <div ref={composeRefs(forwardedRef, ref)} {...props} />;
  },
);
DismissableLayer.displayName = 'DismissableLayer';
