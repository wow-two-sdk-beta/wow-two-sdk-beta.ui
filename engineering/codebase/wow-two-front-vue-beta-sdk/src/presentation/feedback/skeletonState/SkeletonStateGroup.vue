<script lang="ts">
import type { SkeletonStateAnimation } from './SkeletonState.variants';

export interface SkeletonStateGroupProps {
  /** Whether the region is loading; every `SkeletonStateSlot` inside follows it. */
  readonly isLoading: boolean;
  /** The one announcement for the region while it loads. Default `Loading…`. */
  readonly label?: string;
  /** How every skeleton inside moves. */
  readonly animation?: SkeletonStateAnimation;
}
</script>

<script setup lang="ts">
import { computed, provide, useTemplateRef } from 'vue';
import { useLocale } from '../../../foundation/i18n';
import { skeletonStateGroupKey } from './SkeletonStateContext';

/**
 * Renders a loading region: marks itself `aria-busy`, announces once, and switches every
 * `SkeletonStateSlot` inside at the same moment — the skeleton swap for first loads and asked-for refreshes.
 */
defineOptions({ name: 'SkeletonStateGroup' });

const props = defineProps<SkeletonStateGroupProps>();

defineSlots<{
  /** The region: its labels, headings and actions render as they are; its values sit in slots. */
  default?(): unknown;
}>();

const locale = useLocale();
const el = useTemplateRef<HTMLDivElement>('el');

provide(skeletonStateGroupKey, {
  isLoading: computed(() => props.isLoading),
  animation: computed(() => props.animation),
});

defineExpose({ el });
</script>

<template>
  <div ref="el" :aria-busy="props.isLoading || undefined">
    <span v-if="props.isLoading" role="status" class="sr-only">
      {{ props.label ?? locale.t('SkeletonStateGroup.loading', undefined, 'Loading…') }}
    </span>
    <slot />
  </div>
</template>
