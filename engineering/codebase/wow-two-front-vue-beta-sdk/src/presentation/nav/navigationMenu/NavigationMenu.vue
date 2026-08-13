<script lang="ts">
/**
 * The prop surface of `NavigationMenu`.
 *
 * React declared `extends Omit<HTMLAttributes<HTMLElement>, 'defaultValue'>` and
 * read `'aria-label'` off it (defaulting to `Main navigation`). A declared
 * `'aria-label'` would arrive as `props.ariaLabel` and never render, so it stays
 * a fallthrough attr — the default is applied from `useAttrs` below.
 */
export interface NavigationMenuProps {
  /** The value of the item whose panel is open, or `null` if none. Controlled. */
  value?: string | null;

  /** The initially-open item value when uncontrolled. Default `null`. */
  defaultValue?: string | null;
}

/** The accessible name used when the consumer supplies no `aria-label`. */
const DEFAULT_ARIA_LABEL = 'Main navigation';
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { navigationMenuContextKey } from './NavigationMenuContext';

/** The top-level site navigation bar — one expandable panel open at a time. */
defineOptions({ name: 'NavigationMenu', inheritAttrs: false });

/** The `NavigationMenuList` tree — React's `children`. */
defineSlots<{ default(): unknown }>();

/** `value` defaults to `undefined` — the tri-state that separates "controlled to null" from "uncontrolled". */
const props = withDefaults(defineProps<NavigationMenuProps>(), {
  value: undefined,
  defaultValue: null,
});

const emit = defineEmits<{
  /** Replaces React's `onValueChange` — fires with the newly-open item value, or `null`. */
  'value-change': [value: string | null];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const { value: activeId, setValue: setActiveId } = useControlled<string | null>({
  controlled: () => props.value,
  default: () => props.defaultValue,
  onChange: (next) => emit('value-change', next),
});

provide(navigationMenuContextKey, { activeId, setActiveId });

const ariaLabel = computed(() => (attrs['aria-label'] as string | undefined) ?? DEFAULT_ARIA_LABEL);

const classes = computed(() => cn('relative', attrs.class as string | undefined));

/** Everything but `class` and `aria-label`, both re-applied above. */
const rest = computed(() => {
  const { class: _class, 'aria-label': _ariaLabel, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <nav ref="el" :aria-label="ariaLabel" v-bind="rest" :class="classes"><slot /></nav>
</template>
