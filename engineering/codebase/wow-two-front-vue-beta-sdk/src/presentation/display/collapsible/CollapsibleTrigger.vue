<script lang="ts">
export interface CollapsibleTriggerProps {
  /** The as-child flag — renders the single slot child instead of a `<button>`, with the trigger's props merged into it (React's `asChild` + `Slot`). */
  asChild?: boolean;
}
</script>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { ButtonType, dataAttr, HtmlElement } from '../../../foundation/utils';
import { Primitive } from '../../../foundation/primitives';
import { useCollapsibleContext } from './CollapsibleContext';

/** The disclosure toggle — owns `aria-expanded` / `aria-controls` for the pane. */
defineOptions({ name: 'CollapsibleTrigger', inheritAttrs: false });

/** The trigger content — React's required `children`. */
defineSlots<{ default(): unknown }>();

/* Not bound to a `props` const: with every reference now in the template — where the bare
   name compiles to `$props`, which survives a setup throw — the binding would be unused. */
withDefaults(defineProps<CollapsibleTriggerProps>(), { asChild: false });

const context = useCollapsibleContext();

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
const el = shallowRef<HTMLElement | null>(null);
const setEl = (value: unknown): void => {
  const node = (value as { $el?: unknown } | null)?.$el ?? value;
  el.value = node instanceof HTMLElement ? node : null;
};

/* Chained after the consumer's own click (attribute fallthrough puts theirs first) and skipped
   when they called `preventDefault()` — the original's `onClick?.(e); if (e.defaultPrevented) return`. */
function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented || context.disabled) return;
  context.setOpen(!context.open);
}

defineExpose({ el });
</script>

<template>
  <!-- Own attrs first, `v-bind="$attrs"` after (consumer wins, as through React's trailing
       `{...rest}`), own handler last so the consumer's click runs first. -->
  <Primitive
    :ref="setEl"
    :as="HtmlElement.Button"
    :as-child="asChild"
    :id="context.triggerId"
    :type="ButtonType.Button"
    :aria-expanded="context.open"
    :aria-controls="context.contentId"
    :data-state="context.open ? 'open' : 'closed'"
    :data-disabled="dataAttr(context.disabled)"
    :disabled="context.disabled"
    v-bind="$attrs"
    @click="handleClick"
  >
    <slot />
  </Primitive>
</template>
