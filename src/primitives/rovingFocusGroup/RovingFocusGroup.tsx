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
} from 'react';

export type Orientation = 'horizontal' | 'vertical' | 'both';

interface RovingFocusContextValue {
  register: (id: string) => void;
  unregister: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  onItemKeyDown: (event: KeyboardEvent, id: string) => void;
}

const RovingFocusContext = createContext<RovingFocusContextValue | null>(null);

export interface RovingFocusGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation;
  loop?: boolean;
  children: ReactNode;
}

/**
 * Provide arrow-key navigation for a group of focusable children. Children
 * call `useRovingFocusItem()` to register and receive `tabIndex` / event
 * handlers. Used by Tabs, ToggleGroup, RadioGroup, Menu.
 */
export const RovingFocusGroup = forwardRef<HTMLDivElement, RovingFocusGroupProps>(
  function RovingFocusGroup(
    { orientation = 'horizontal', loop = true, children, ...props },
    ref,
  ) {
    const items = useRef<string[]>([]);
    const [focusedId, setFocusedId] = useState<string | null>(null);

    const register = useCallback((id: string) => {
      if (!items.current.includes(id)) items.current.push(id);
      setFocusedId((current) => current ?? id);
    }, []);

    const unregister = useCallback((id: string) => {
      items.current = items.current.filter((i) => i !== id);
    }, []);

    const onItemKeyDown = useCallback(
      (event: KeyboardEvent, id: string) => {
        const list = items.current;
        const idx = list.indexOf(id);
        if (idx === -1) return;
        const isVert = orientation === 'vertical' || orientation === 'both';
        const isHoriz = orientation === 'horizontal' || orientation === 'both';
        let next = idx;
        if ((event.key === 'ArrowRight' && isHoriz) || (event.key === 'ArrowDown' && isVert)) {
          next = idx + 1;
          if (next >= list.length) next = loop ? 0 : list.length - 1;
        } else if ((event.key === 'ArrowLeft' && isHoriz) || (event.key === 'ArrowUp' && isVert)) {
          next = idx - 1;
          if (next < 0) next = loop ? list.length - 1 : 0;
        } else if (event.key === 'Home') {
          next = 0;
        } else if (event.key === 'End') {
          next = list.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        const id2 = list[next];
        if (id2) setFocusedId(id2);
      },
      [orientation, loop],
    );

    const value = useMemo(
      () => ({ register, unregister, focusedId, setFocusedId, onItemKeyDown }),
      [register, unregister, focusedId, onItemKeyDown],
    );

    return (
      <RovingFocusContext.Provider value={value}>
        <div ref={ref} role="group" {...props}>
          {children}
        </div>
      </RovingFocusContext.Provider>
    );
  },
);

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
export function useRovingFocusItem(): UseRovingFocusItemReturn {
  const context = useContext(RovingFocusContext);
  const id = useId();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    context?.register(id);
    return () => context?.unregister(id);
  }, [context, id]);

  useEffect(() => {
    if (context?.focusedId === id && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [context?.focusedId, id]);

  return {
    ref: (node) => {
      ref.current = node;
    },
    tabIndex: !context || context.focusedId === id ? 0 : -1,
    onKeyDown: (e) => context?.onItemKeyDown(e, id),
    onFocus: () => context?.setFocusedId(id),
    'data-roving-focus-item': true,
  };
}
