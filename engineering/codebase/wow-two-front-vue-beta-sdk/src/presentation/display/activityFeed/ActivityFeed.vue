<script lang="ts">
export interface ActivityFeedProps {
  /** The compact spacing variant. */
  isDense?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, dataAttr } from '../../../foundation/utils';

/**
 * Ordered feed of `ActivityItem` rows — "actor + verb + target" sentences with
 * a connector rail running down the leading column.
 */
defineOptions({ name: 'ActivityFeed', inheritAttrs: false });

/** The `ActivityItem` rows — React's required `children`. */
defineSlots<{ default(): unknown }>();

/**
 * `isDense` defaults to `undefined`, not `false`: Vue casts an absent `Boolean`
 * prop to `false`, and `data-dense` must stay absent rather than render empty.
 */
const props = withDefaults(defineProps<ActivityFeedProps>(), { isDense: undefined });

const attrs = useAttrs();
const el = useTemplateRef<HTMLOListElement>('el');

const classes = computed(() =>
  cn('flex list-none flex-col', props.isDense ? 'gap-3' : 'gap-5', attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <ol ref="el" :data-dense="dataAttr(props.isDense)" v-bind="rest" :class="classes">
    <slot />
  </ol>
</template>
