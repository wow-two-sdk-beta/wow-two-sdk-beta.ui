<script lang="ts">
import type { MenuItemState } from './Menu.variants';

/**
 * Represents the prop surface of `MenuItem`.
 *
 * React declared `extends Omit<MenuItemVariants, 'state'>`; `state` is the only
 * axis `menuItemVariants` carries, so the heritage contributed nothing and is
 * dropped — a `VariantProps<…>` base is unresolvable to the SFC compiler anyway.
 */
export interface MenuItemProps {
  /** The visual state of the item. */
  readonly state?: MenuItemState;

  /** The disabled state — blocks activation. */
  readonly isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { DomOrderExtensions } from '../../../foundation/dom';
import { computed, onScopeDispose, shallowRef, useAttrs, watch } from 'vue';
import { cn } from '../../../foundation/styles';
import { dataAttr } from '../../../foundation/dom';
import { useId } from '../../../foundation/identifiers';
import { useMenuContext } from './MenuContext';
import { MenuItemState as MenuItemStateToken, menuItemVariants } from './Menu.variants';

/** Renders one activatable menu row; the arrow keys walk the enabled siblings. */
defineOptions({ name: 'MenuItem', inheritAttrs: false });

/** The row content — React's `children`. */
defineSlots<{ default(): unknown }>();

/** `isDisabled` defaults to `undefined`, not `false` — an absent optional boolean must stay absent. */
const props = withDefaults(defineProps<MenuItemProps>(), {
  state: undefined,
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** Fires when the reader activates the row with Enter, Space, or a click; the menu closes after. */
  select: [];
}>();

const attrs = useAttrs();
const menu = useMenuContext();
const id = useId();
const el = shallowRef<HTMLButtonElement | null>(null);

/* React re-registered from an effect keyed on `[ctx, id, isDisabled]`; the same
   two inputs are watched here, so a disabled toggle re-registers and the arrow
   walk sees it without a remount. */
watch(
  [el, () => props.isDisabled],
  ([node, isDisabled]) => {
    menu.registerItem({ id, el: node, disabled: isDisabled === true });
  },
  { immediate: true, flush: 'post' },
);

onScopeDispose(() => menu.unregisterItem(id));

function moveFocus(target: 1 | -1 | 'first' | 'last'): void {
  const list = DomOrderExtensions.inDocumentOrder(
    menu.items.filter((i) => !i.disabled),
    (item) => item.el,
  );
  if (list.length === 0) return;
  if (target === 'first' || target === 'last') {
    list[target === 'first' ? 0 : list.length - 1]?.el?.focus();
    return;
  }
  const index = list.findIndex((i) => i.id === id);
  let nextIndex = index + target;
  if (index === -1) nextIndex = target === 1 ? 0 : list.length - 1;
  if (nextIndex < 0) nextIndex = list.length - 1;
  if (nextIndex >= list.length) nextIndex = 0;
  list[nextIndex]?.el?.focus();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || props.isDisabled) return;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      moveFocus(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      moveFocus(-1);
      break;
    case 'Home':
      event.preventDefault();
      moveFocus('first');
      break;
    case 'End':
      event.preventDefault();
      moveFocus('last');
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      emit('select');
      menu.close();
      break;
  }
}

function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented || props.isDisabled) return;
  emit('select');
  menu.close();
}

const itemState = computed(
  () => props.state ?? (props.isDisabled ? MenuItemStateToken.Disabled : MenuItemStateToken.Default),
);

const classes = computed(() => cn(menuItemVariants({ state: itemState.value }), attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- Own attrs, then `v-bind="rest"`, then own handlers last — a consumer's
       `click` / `keydown` handler therefore runs first, the order React got from
       calling `onClick?.(e)` ahead of its own logic, which is what makes the
       `defaultPrevented` check meaningful. -->
  <button
    ref="el"
    type="button"
    role="menuitem"
    :disabled="isDisabled"
    :aria-disabled="isDisabled || undefined"
    :data-disabled="dataAttr(isDisabled)"
    v-bind="rest"
    :class="classes"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <slot />
  </button>
</template>
