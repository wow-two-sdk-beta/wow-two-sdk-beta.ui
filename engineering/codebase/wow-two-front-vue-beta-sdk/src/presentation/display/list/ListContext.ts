import { inject, type InjectionKey } from 'vue';
import type { ListMarker } from './List.variants';

/** The marker preset a `List` root shares with its items. */
export interface ListContextValue {
  /** The root's `marker` prop. Live getter — read it, don't destructure it. */
  readonly marker: ListMarker;
}

export const ListKey: InjectionKey<ListContextValue> = Symbol('wow-two.list');

/**
 * Reads the surrounding `List`.
 *
 * Unlike the other compound families in this group this does **not** throw: a bare
 * `<li>` is documented as a valid child, so `ListItem` has to stand alone. Outside a
 * `List` the marker reads as `none`, which is the root's own default.
 */
export function useListContext(): ListContextValue {
  return inject(ListKey, { marker: 'none' });
}
