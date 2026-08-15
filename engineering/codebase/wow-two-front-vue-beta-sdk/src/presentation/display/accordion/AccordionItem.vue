<script lang="ts">
export interface AccordionItemProps {
  /** The identity of this panel within the group's open set. */
  value: string;
  /** The disabled state for this item alone. Default `false`. */
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn, dataAttr } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { AccordionItemKey, useAccordionContext, type AccordionItemContextValue } from './AccordionContext';

/** One disclosure panel — wraps an `AccordionTrigger` and an `AccordionContent`. */
defineOptions({ name: 'AccordionItem', inheritAttrs: false });

/** The trigger + content — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<AccordionItemProps>(), { isDisabled: false });

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const accordion = useAccordionContext();

const contentId = useId();
const triggerId = useId();

const open = computed(() => accordion.isOpen(props.value));
const itemDisabled = computed(() => props.isDisabled || accordion.disabled);

/* Live getters — `open` and `disabled` both change after mount. */
provide<AccordionItemContextValue>(AccordionItemKey, {
  get value() {
    return props.value;
  },
  get open() {
    return open.value;
  },
  contentId,
  triggerId,
  get disabled() {
    return itemDisabled.value;
  },
});

const classes = computed(() => cn('border-b border-border', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    :data-state="open ? 'open' : 'closed'"
    :data-disabled="dataAttr(itemDisabled)"
    v-bind="rest"
    :class="classes"
  >
    <slot />
  </div>
</template>
