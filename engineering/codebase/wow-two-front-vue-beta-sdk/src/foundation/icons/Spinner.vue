<script lang="ts">
export interface SpinnerProps {
  /** The extra classes merged onto the underlying SVG. */
  className?: string;
}
</script>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
import { cn } from '../utils';

/** Renders a spinning loader icon — for inline action-loading feedback or standalone progress indication. */
defineOptions({ name: 'Spinner' });

const props = defineProps<SpinnerProps>();
</script>

<template>
  <!--
    Sized by class, not by the `size` prop: `lucide-vue-next` types `size` as `number`, so the
    original's `size="1em"` (which `lucide-react` accepted) has no Vue equivalent. `size-[1em]`
    wins over the icon's default `width`/`height` attributes, keeping the spinner scaled to the
    current font-size — and `cn` puts it first, so a caller's own sizing class still overrides it.
  -->
  <Loader2 :class="cn('animate-spin size-[1em]', props.className)" aria-hidden="true" />
</template>
