import type { InjectionKey } from 'vue';
import type { ToggleItemRole } from './ToggleButtonGroup.variants';

/**
 * The seam between `ToggleButtonGroup` and its `ToggleButton` children.
 *
 * The React original reached into its children with `Children.map` +
 * `cloneElement`, injecting `isPressed` / `onPressedChange` (and the tablist
 * roles) onto each one. Vue has no equivalent — a parent cannot rewrite a
 * child's props — so the same coordination runs through provide/inject: the
 * group publishes the selection, each item reads its own slice off its `value`.
 *
 * Semantics are preserved exactly: an item with no `value` is inert, an item
 * with an explicit `isPressed` prop still wins over the group, and the item's
 * own `pressed-change` fires before the group's toggle.
 */
export interface ToggleButtonGroupContextValue {
  /** True while the item carrying `value` is active. Always false for a valueless item. */
  isPressed: (value: string | undefined) => boolean;

  /** Flips the item carrying `value` — clears the selection in single mode, adds/removes in multi. No-op for a valueless item. */
  toggle: (value: string | undefined) => void;

  /** The ARIA role wiring the group applies to each item. Live getter — read it, don't destructure it. */
  readonly itemRole: ToggleItemRole;
}

export const ToggleButtonGroupKey: InjectionKey<ToggleButtonGroupContextValue> = Symbol(
  'wow-two.toggleButtonGroup',
);
