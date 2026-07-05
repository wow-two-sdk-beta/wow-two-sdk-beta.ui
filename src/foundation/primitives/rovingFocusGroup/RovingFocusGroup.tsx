import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useComposedRefs } from '../../utils/composeRefs';
import { useDirection } from '../directionProvider';

export type Orientation = 'horizontal' | 'vertical' | 'both';

interface ItemEntry {
  id: string;
  node: HTMLElement | null;
}

interface RovingFocusContextValue {
  register: (id: string, node: HTMLElement | null) => void;
  unregister: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  onItemKeyDown: (event: KeyboardEvent, id: string) => void;
  /** True once the user has interacted with the group; reset when focus leaves. */
  interactedRef: RefObject<boolean>;
  groupRef: RefObject<HTMLDivElement | null>;
}

const RovingFocusContext = createContext<RovingFocusContextValue | null>(null);

export interface RovingFocusGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation;
  canLoop?: boolean;
  children: ReactNode;
}

/**
 * Provide arrow-key navigation for a group of focusable children. Children
 * call `useRovingFocusItem()` to register and receive `tabIndex` / event
 * handlers. Used by Tabs, ToggleGroup, RadioGroup, Menu.
 */
export const RovingFocusGroup = forwardRef<HTMLDivElement, RovingFocusGroupProps>(
  function RovingFocusGroup(
    { orientation = 'horizontal', canLoop = true, children, ...props },
    ref,
  ) {
    const items = useRef<ItemEntry[]>([]);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const interactedRef = useRef(false);
    const groupRef = useRef<HTMLDivElement | null>(null);
    const composedRef = useComposedRefs(ref, groupRef);
    const direction = useDirection();

    const register = useCallback((id: string, node: HTMLElement | null) => {
      if (!items.current.some((item) => item.id === id)) {
        const entry: ItemEntry = { id, node };
        // Insert by DOM order (not mount order) so dynamically inserted
        // items navigate in visual order.
        const index = node
          ? items.current.findIndex(
              (item) =>
                item.node !== null &&
                (node.compareDocumentPosition(item.node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
            )
          : -1;
        if (index === -1) items.current.push(entry);
        else items.current.splice(index, 0, entry);
      }
      setFocusedId((current) => current ?? id);
    }, []);

    const unregister = useCallback((id: string) => {
      const idx = items.current.findIndex((item) => item.id === id);
      items.current = items.current.filter((item) => item.id !== id);
      // If the tab stop unmounts, advance to the next remaining item (or
      // the first) so the group keeps exactly one tabbable item.
      setFocusedId((current) => {
        if (current !== id) return current;
        const next = items.current[idx] ?? items.current[0];
        return next ? next.id : null;
      });
    }, []);

    // Reset the interaction flag when focus leaves the group so tab-stop
    // bookkeeping (focusedId updates) never steals focus back.
    useEffect(() => {
      const node = groupRef.current;
      if (!node) return;
      const onFocusOut = (event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (!next || !node.contains(next)) interactedRef.current = false;
      };
      node.addEventListener('focusout', onFocusOut);
      return () => node.removeEventListener('focusout', onFocusOut);
    }, []);

    const onItemKeyDown = useCallback(
      (event: KeyboardEvent, id: string) => {
        const list = items.current;
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) return;
        const isVert = orientation === 'vertical' || orientation === 'both';
        const isHoriz = orientation === 'horizontal' || orientation === 'both';
        // Horizontal arrows mirror in RTL.
        const nextHorizKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const prevHorizKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
        let next = idx;
        if ((event.key === nextHorizKey && isHoriz) || (event.key === 'ArrowDown' && isVert)) {
          next = idx + 1;
          if (next >= list.length) next = canLoop ? 0 : list.length - 1;
        } else if ((event.key === prevHorizKey && isHoriz) || (event.key === 'ArrowUp' && isVert)) {
          next = idx - 1;
          if (next < 0) next = canLoop ? list.length - 1 : 0;
        } else if (event.key === 'Home') {
          next = 0;
        } else if (event.key === 'End') {
          next = list.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        interactedRef.current = true;
        const entry = list[next];
        if (entry) setFocusedId(entry.id);
      },
      [orientation, canLoop, direction],
    );

    const value = useMemo(
      () => ({
        register,
        unregister,
        focusedId,
        setFocusedId,
        onItemKeyDown,
        interactedRef,
        groupRef,
      }),
      [register, unregister, focusedId, onItemKeyDown],
    );

    return (
      <RovingFocusContext.Provider value={value}>
        <div ref={composedRef} role="group" {...props}>
          {children}
        </div>
      </RovingFocusContext.Provider>
    );
  },
);

export interface UseRovingFocusItemOptions {
  /** Preferred tab stop while focus is outside the group (e.g. the selected tab) — APG composite-widget pattern. */
  isActive?: boolean;
}

export interface UseRovingFocusItemReturn {
  ref: (node: HTMLElement | null) => void;
  tabIndex: 0 | -1;
  onKeyDown: (event: KeyboardEvent) => void;
  onFocus: () => void;
  'data-roving-focus-item': boolean;
}

/**
 * Inside a `RovingFocusGroup`, returns props to spread onto a focusable item.
 * Outside, returns inert props (tabIndex 0).
 */
export function useRovingFocusItem(
  options: UseRovingFocusItemOptions = {},
): UseRovingFocusItemReturn {
  const { isActive = false } = options;
  const context = useContext(RovingFocusContext);
  const id = useId();
  const ref = useRef<HTMLElement | null>(null);

  const register = context?.register;
  const unregister = context?.unregister;
  useEffect(() => {
    register?.(id, ref.current);
    return () => unregister?.(id);
  }, [register, unregister, id]);

  // Move DOM focus only after user interaction — never on initial mount.
  const focusedId = context?.focusedId;
  const interactedRef = context?.interactedRef;
  useEffect(() => {
    if (
      focusedId === id &&
      interactedRef?.current &&
      ref.current &&
      document.activeElement !== ref.current
    ) {
      ref.current.focus();
    }
  }, [focusedId, interactedRef, id]);

  // Keep the active item (e.g. selected tab) as the tab stop whenever focus
  // is outside the group.
  const setFocusedId = context?.setFocusedId;
  const groupRef = context?.groupRef;
  useEffect(() => {
    if (!isActive || !setFocusedId || !groupRef) return;
    const groupNode = groupRef.current;
    if (!groupNode || !groupNode.contains(document.activeElement)) setFocusedId(id);
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (!next || !groupNode?.contains(next)) setFocusedId(id);
    };
    groupNode?.addEventListener('focusout', onFocusOut);
    return () => groupNode?.removeEventListener('focusout', onFocusOut);
  }, [isActive, setFocusedId, groupRef, id]);

  return {
    ref: (node) => {
      ref.current = node;
    },
    tabIndex: !context || context.focusedId === id ? 0 : -1,
    onKeyDown: (e) => context?.onItemKeyDown(e, id),
    onFocus: () => {
      if (!context) return;
      context.interactedRef.current = true;
      context.setFocusedId(id);
    },
    'data-roving-focus-item': true,
  };
}
