import { inject, type InjectionKey } from 'vue';

/** One registered `MenuItem` — the unit the arrow-key walk moves across. */
export interface MenuItemEntry {
  id: string;
  el: HTMLButtonElement | null;
  disabled: boolean;
}

/**
 * The seam between `Menu` and its `MenuItem` / `MenuGroup` / `MenuLabel` /
 * `MenuSeparator` children.
 *
 * React attached these as `Menu.Item` / `.Group` / … over a `createContext`. An
 * SFC's generated default export cannot carry statics cleanly, so they ship as
 * sibling components and share state through provide/inject instead.
 */
export interface MenuContextValue {
  registerItem: (entry: MenuItemEntry) => void;
  unregisterItem: (id: string) => void;

  /** The live registry — a plain array, read imperatively, exactly as React's `useRef` list was. */
  items: Array<MenuItemEntry>;

  /** Closes the menu. React's `onClose`; the root re-emits it. */
  close: () => void;
}

export const MenuKey: InjectionKey<MenuContextValue> = Symbol('wow-two.menu');

export function useMenuContext(): MenuContextValue {
  const context = inject(MenuKey, null);
  if (!context) {
    throw new Error('MenuItem / MenuGroup / MenuLabel / MenuSeparator must be used inside <Menu>');
  }
  return context;
}
