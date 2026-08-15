<script lang="ts">
import type { Orientation } from '../../../foundation/utils';

/** A plain rule — `orientation` is required (no silent default; a rule's axis should always be stated). */
export interface PlainDividerProps {
  /**
   * The axis of the rule — the line's OWN direction: `vertical` draws a `│` between side-by-side content;
   * `horizontal` draws a `─` between stacked content.
   */
  orientation: Orientation;

  label?: never;
}

/** A labelled rule — the classic "or" separator; always horizontal, so `orientation` does not apply. */
export interface LabelledDividerProps {
  /**
   * The centered content overlaid on the (always-horizontal) rule, e.g. `<Divider label="or" />`.
   * React typed this `ReactNode`; a Vue prop renders text, so richer content goes through the
   * same-named `label` slot — which overrides this value but does NOT select the labelled branch.
   */
  label: string | number;

  orientation?: never;
}

/**
 * A thin rule that separates content, using the semantic `border` token. Either a plain rule — pass the
 * required `orientation` (`<Divider :orientation="Orientation.Vertical" />`) — or a labelled horizontal rule —
 * pass `label` (`<Divider label="or" />`), which sits on the surface background.
 */
export type DividerProps = PlainDividerProps | LabelledDividerProps;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { dividerVariants } from './Divider.variants';

defineOptions({ name: 'Divider', inheritAttrs: false });

/** Rich-content override for the `label` prop. Never a discriminator — `label != null` alone picks the branch, as in React. */
defineSlots<{ label?(): unknown }>();

const props = defineProps<DividerProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const isLabelled = computed(() => props.label != null);

const labelledClasses = computed(() => cn('flex w-full items-center gap-3', attrs.class as string | undefined));

const plainClasses = computed(() =>
  cn(dividerVariants({ orientation: props.orientation }), attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div v-if="isLabelled" ref="el" role="separator" aria-orientation="horizontal" v-bind="rest" :class="labelledClasses">
    <span class="h-px flex-1 bg-border" />
    <span class="text-sm text-muted-foreground"
      ><slot name="label">{{ props.label }}</slot></span
    >
    <span class="h-px flex-1 bg-border" />
  </div>

  <div v-else ref="el" role="separator" :aria-orientation="props.orientation" v-bind="rest" :class="plainClasses" />
</template>
