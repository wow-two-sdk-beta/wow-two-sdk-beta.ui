import { inject, type InjectionKey } from 'vue';

/**
 * The seam between `Tree` and its `TreeGroup` / `TreeItem` children.
 *
 * React attached those as `Tree.Group` / `.Item` statics over a `createContext`.
 * An SFC's generated default export cannot carry statics cleanly, so they ship
 * as sibling components and share state through provide/inject instead.
 *
 * `selectedValue` and `expanded` are live getters — read them, don't destructure.
 */
export interface TreeContextValue {
  /** The selected leaf value, or `null`. */
  readonly selectedValue: string | null;
  /** Selects a leaf. */
  setSelectedValue: (value: string) => void;
  /** The expanded branch values. */
  readonly expanded: ReadonlySet<string>;
  /** Flips one branch open/closed. */
  toggleExpanded: (value: string) => void;
}

export const TreeKey: InjectionKey<TreeContextValue> = Symbol('wow-two.tree');

export function useTreeContext(): TreeContextValue {
  const context = inject(TreeKey, null);
  if (!context) throw new Error('Tree.* must be used inside <Tree>');
  return context;
}

/** The nesting depth, 1-based — React's `TreeLevelContext`, defaulted to the root level. */
export interface TreeLevelValue {
  readonly level: number;
}

export const TreeLevelKey: InjectionKey<TreeLevelValue> = Symbol('wow-two.tree.level');

/** Returns the level holder rather than the number, so a nested provide stays live. */
export function useTreeLevel(): TreeLevelValue {
  return inject(TreeLevelKey, { level: 1 });
}
