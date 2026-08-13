<script lang="ts">
export interface MetaInlineProps {
  /** The gap between left-side meta items. Default `2`. */
  gap?: '1' | '2' | '3';
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import Inline from '../../layout/inline/Inline.vue';

/**
 * Horizontal inline row of meta items (Badges, MetricChips, Status, etc.)
 * + an optional trailing actions slot. Captures the recurring "meta row"
 * pattern in drawer/card bodies — badges left, action buttons right.
 */
defineOptions({ name: 'MetaInline', inheritAttrs: false });

defineSlots<{
  /** The left-side meta items — React's `children`. */
  default(): unknown;

  /** The right-aligned slot — typically small action buttons. */
  actions?(): unknown;
}>();

const props = withDefaults(defineProps<MetaInlineProps>(), { gap: '2' });

const attrs = useAttrs();
const inner = useTemplateRef<InstanceType<typeof Inline>>('inner');

/** The inner `Inline`'s root element — the React original's forwarded ref. */
const el = computed(() => inner.value?.el ?? null);

const classes = computed(() => cn('w-full', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <Inline ref="inner" :gap="props.gap" v-bind="rest" :class="classes">
    <slot />
    <div v-if="$slots.actions" class="ml-auto flex items-center gap-1">
      <slot name="actions" />
    </div>
  </Inline>
</template>
