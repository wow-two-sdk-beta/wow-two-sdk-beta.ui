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
import { Direction, useDirection } from '../directionProvider';

/**
 * Defines the arrow-key navigation axis of a roving-focus group.
 *
 * Diverges from the shared `Orientation` (foundation/utils) by adding `Both`
 * (2-D grids like ColorSwatchPicker) — stays local per the enum-alignment
 * divergence rule.
 */
export const Orientation = {
  /** Refers to left/right arrow navigation only. */
  Horizontal: 'horizontal',
  /** Refers to up/down arrow navigation only. */
  Vertical: 'vertical',
  /** Refers to both-axis (grid) arrow navigation. */
  Both: 'both',
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];

interface ItemEntry {
  id: string;
  node: HTMLElement | null;
}

/**
 * Disabled state is read from the DOM node rather than a hook option, so
 * items keep declaring it the way they already do (native `disabled`,
 * `aria-disabled="true"`, or a bare `data-disabled` attr) and the group sees
 * changes without re-registration.
 */
function isNodeDisabled(node: HTMLElement | null): boolean {
  if (!node) return false;
  return (
    node.matches(':disabled') ||
    node.getAttribute('aria-disabled') === 'true' ||
    node.hasAttribute('data-disabled')
  );
}

const isEntryDisabled = (entry: ItemEntry): boolean => isNodeDisabled(entry.node);

/**
 * First enabled entry walking from `start` (inclusive) in direction `dir`.
 * Wraps at the edges when `loop`, otherwise stops there. Returns undefined
 * when no enabled entry is reachable.
 */
function findEnabled(
  list: ReadonlyArray<ItemEntry>,
  start: number,
  dir: 1 | -1,
  loop: boolean,
): ItemEntry | undefined {
  const len = list.length;
  if (len === 0) return undefined;
  for (let step = 0; step < len; step++) {
    let index = start + dir * step;
    if (loop) index = ((index % len) + len) % len;
    else if (index < 0 || index >= len) return undefined;
    const entry = list[index];
    if (entry && !isEntryDisabled(entry)) return entry;
  }
  return undefined;
}

/** Nearest enabled entry around `idx` (excluding it), preferring the next one on ties. */
function findNearestEnabled(list: ReadonlyArray<ItemEntry>, idx: number): ItemEntry | undefined {
  for (let distance = 1; distance < list.length; distance++) {
    const forward = list[idx + distance];
    if (forward && !isEntryDisabled(forward)) return forward;
    const backward = list[idx - distance];
    if (backward && !isEntryDisabled(backward)) return backward;
  }
  return undefined;
}

interface RovingFocusContextValue {
  register: (id: string, node: HTMLElement | null) => void;
  unregister: (id: string) => void;
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  onItemKeyDown: (event: KeyboardEvent, id: string) => void;
  /** Re-validates that the tab stop sits on an enabled item (see useRovingFocusItem). */
  ensureEnabledStop: (id: string) => void;

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
 * handlers. Disabled items (native `disabled`, `aria-disabled="true"`, or
 * `data-disabled`) are never valid stops: arrow / Home / End navigation
 * skips them (wrap-around keeps skipping past disabled edges) and the tab
 * stop is always kept on an enabled item. Used by Tabs, Toolbar, Tree,
 * Accordion, Stepper, NavigationMenu, Menubar.
 */
export const RovingFocusGroup = forwardRef<HTMLDivElement, RovingFocusGroupProps>(
  function RovingFocusGroup(
    { orientation = Orientation.Horizontal, canLoop = true, children, ...props },
    ref,
  ) {
    const items = useRef<Array<ItemEntry>>([]);
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
      // A disabled item never claims the tab stop — tabIndex 0 on an
      // unfocusable element would make the whole group untabbable.
      if (!isNodeDisabled(node)) setFocusedId((current) => current ?? id);
    }, []);

    const unregister = useCallback((id: string) => {
      const idx = items.current.findIndex((item) => item.id === id);
      items.current = items.current.filter((item) => item.id !== id);
      // If the tab stop unmounts, advance to the next remaining enabled item
      // (wrapping to the first) so the group keeps exactly one tabbable item.
      setFocusedId((current) => {
        if (current !== id) return current;
        const next = findEnabled(items.current, idx, 1, true);
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
        const isVert = orientation === Orientation.Vertical || orientation === Orientation.Both;
        const isHoriz = orientation === Orientation.Horizontal || orientation === Orientation.Both;
        // Horizontal arrows mirror in RTL.
        const nextHorizKey = direction === Direction.Rtl ? 'ArrowLeft' : 'ArrowRight';
        const prevHorizKey = direction === Direction.Rtl ? 'ArrowRight' : 'ArrowLeft';
        // Disabled items are skipped (APG): the search walks past them —
        // wrapping at the edges when canLoop — until an enabled item is
        // found; Home / End land on the first / last *enabled* item.
        let next: ItemEntry | undefined;
        if ((event.key === nextHorizKey && isHoriz) || (event.key === 'ArrowDown' && isVert)) {
          next = findEnabled(list, idx + 1, 1, canLoop);
        } else if ((event.key === prevHorizKey && isHoriz) || (event.key === 'ArrowUp' && isVert)) {
          next = findEnabled(list, idx - 1, -1, canLoop);
        } else if (event.key === 'Home') {
          next = findEnabled(list, 0, 1, false);
        } else if (event.key === 'End') {
          next = findEnabled(list, list.length - 1, -1, false);
        } else {
          return;
        }
        event.preventDefault();
        interactedRef.current = true;
        if (next) setFocusedId(next.id);
      },
      [orientation, canLoop, direction],
    );

    // Items call this after every commit — keeps the tab stop off disabled
    // items even when disabled state toggles long after registration.
    const ensureEnabledStop = useCallback((id: string) => {
      const list = items.current;
      const caller = list.find((item) => item.id === id);
      if (!caller) return;
      setFocusedId((current) => {
        // No stop is held (every item registered disabled) — the first
        // enabled caller claims it.
        if (current === null) return isEntryDisabled(caller) ? null : id;
        // The held stop turned disabled — hand it to the nearest enabled item.
        const heldIdx = list.findIndex((item) => item.id === current);
        const held = heldIdx === -1 ? undefined : list[heldIdx];
        if (held && isEntryDisabled(held)) {
          const next = findNearestEnabled(list, heldIdx);
          return next ? next.id : null;
        }
        return current;
      });
    }, []);

    const value = useMemo(
      () => ({
        register,
        unregister,
        focusedId,
        setFocusedId,
        onItemKeyDown,
        ensureEnabledStop,
        interactedRef,
        groupRef,
      }),
      [register, unregister, focusedId, onItemKeyDown, ensureEnabledStop],
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

  // Disabled state lives on the DOM node (`disabled` / `aria-disabled` /
  // `data-disabled`) and can change on any commit without re-registering —
  // re-validate after every render so a disabled item never holds the stop
  // (the group moves it to the nearest enabled item).
  const ensureEnabledStop = context?.ensureEnabledStop;
  useEffect(() => {
    ensureEnabledStop?.(id);
  });

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
