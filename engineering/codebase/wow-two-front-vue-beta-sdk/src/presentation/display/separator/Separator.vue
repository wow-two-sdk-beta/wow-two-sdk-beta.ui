<script lang="ts">
/* `Orientation` is imported here (not in `<script setup>`) so the one binding
   serves as both the type below and the runtime value used in `withDefaults`. */
import { Orientation } from '../../../foundation/utils';

export interface SeparatorProps {
  orientation?: Orientation;
  /** The decorative mode — `role="none"`, unannounced. Default `true`; set `false` when meaningful in context. */
  isDecorative?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Visual divider. Defaults to a horizontal hairline; pass `orientation="vertical"`
 * for column dividers (use inside a flex/grid with explicit height).
 */
defineOptions({ name: 'Separator', inheritAttrs: false });

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: Orientation.Horizontal,
  isDecorative: true,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn(
    'bg-border',
    props.orientation === Orientation.Horizontal ? 'h-px w-full' : 'w-px self-stretch',
    attrs.class as string | undefined,
  ),
);

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
    :role="props.isDecorative ? 'none' : 'separator'"
    :aria-orientation="props.isDecorative ? undefined : props.orientation"
    v-bind="rest"
    :class="classes"
  />
</template>
