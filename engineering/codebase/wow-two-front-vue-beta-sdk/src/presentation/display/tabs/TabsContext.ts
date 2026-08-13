import { inject, type InjectionKey } from 'vue';
import type { Orientation } from '../../../foundation/utils';

/** Defines when a Tabs tab activates on keyboard navigation. */
export const TabsActivationMode = {
  /** Refers to activating a tab as soon as it is focused. */
  Automatic: 'automatic',
  /** Refers to requiring Enter/Space to activate a focused tab. */
  Manual: 'manual',
} as const;

export type TabsActivationMode = (typeof TabsActivationMode)[keyof typeof TabsActivationMode];

/**
 * The seam between `Tabs` and its `TabsList` / `TabsTab` / `TabsPanel` children.
 *
 * React attached these as `Tabs.List` / `.Tab` / `.Panel` statics over a
 * `createContext`. An SFC's generated default export cannot carry statics
 * cleanly, so they ship as sibling components and share state through
 * provide/inject instead.
 *
 * Every field but `setValue` is a live getter — read them, don't destructure.
 */
export interface TabsContextValue {
  /** The active tab value. */
  readonly value: string;
  /** Selects a tab. */
  setValue: (value: string) => void;
  /** The layout axis of the tablist. */
  readonly orientation: Orientation;
  /** Whether focus alone activates a tab. */
  readonly activationMode: TabsActivationMode;
  /** The id prefix shared by every tab / panel pair. */
  readonly baseId: string;
}

export const TabsKey: InjectionKey<TabsContextValue> = Symbol('wow-two.tabs');

export function useTabsContext(): TabsContextValue {
  const context = inject(TabsKey, null);
  if (!context) throw new Error('Tabs.* must be used inside <Tabs>');
  return context;
}
