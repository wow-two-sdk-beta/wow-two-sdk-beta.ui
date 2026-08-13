<script lang="ts">
/** The prop surface of `HoverCardTrigger`. */
export interface HoverCardTriggerProps {
  /**
   * Merge onto the single slot child instead of rendering a `<span>`. Default `true`.
   *
   * React declared this prop but always cloned the child regardless; honouring it
   * gives the same default with an escape hatch when the slot is not a single element.
   */
  asChild?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
import { toHtmlElement } from '../OverlayHelpers';
import { Primitive } from '../../../foundation/primitives';
import { useHoverCardContext } from './HoverCard.vue';

/* Opens the enclosing `HoverCard` on hover / focus and doubles as its positioning anchor. */
defineOptions({ name: 'HoverCardTrigger', inheritAttrs: false });

/** The trigger element — React's `children`, typed there as a single `ReactElement`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<HoverCardTriggerProps>(), { asChild: true });

const attrs = useAttrs();
const context = useHoverCardContext();
const inner = useTemplateRef<ComponentPublicInstance>('inner');

/* React composed a ref onto the cloned child to seed `ctx.triggerRef`; a post-flush watch is the equivalent. */
watch(
  inner,
  (instance) => {
    context.triggerEl.value = toHtmlElement(instance?.$el);
  },
  { immediate: true, flush: 'post' },
);

/** `Primitive` renders the real element, so its `$el` is this component's root. */
const el = computed(() => (inner.value?.$el ?? null) as HTMLElement | null);

defineExpose({ el });
</script>

<template>
  <!--
    Handlers come after `v-bind="attrs"`, so Vue chains the caller's own first —
    React called `trigger.props.onPointerEnter?.(e)` before its own in each clone.
  -->
  <Primitive
    ref="inner"
    as="span"
    :as-child="props.asChild"
    v-bind="attrs"
    @pointerenter="context.show()"
    @pointerleave="context.hide()"
    @focus="context.show()"
    @blur="context.hide()"
  >
    <slot />
  </Primitive>
</template>
