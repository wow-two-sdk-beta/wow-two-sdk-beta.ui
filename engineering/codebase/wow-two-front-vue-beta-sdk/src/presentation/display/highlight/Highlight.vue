<script lang="ts">
export interface HighlightProps {
  /**
   * The source text to render.
   *
   * React took this as `children: string` and split it. A Vue slot renders
   * opaque vnodes that cannot be tokenised, so the text has to arrive as a
   * prop — named `text`, matching the sibling `Snippet`, which faced the same
   * "string consumed by logic, not rendered as a node" case.
   */
  text: string;

  /** The substring(s) to highlight. Match is case-insensitive. */
  query: string | ReadonlyArray<string>;

  /** The whole-word-only matching mode. Default `false`. */
  isWholeWord?: boolean;
}

/** One run of the source text, flagged for `Mark` wrapping. */
interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

function escapeRegExp(re: string): string {
  return re.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import Mark from '../mark/Mark.vue';

/**
 * Wraps each occurrence of `query` (or any of `query[]`) inside the `text`
 * in a `<Mark>`. Case-insensitive; pass `isWholeWord` to avoid partial
 * matches.
 */
defineOptions({ name: 'Highlight', inheritAttrs: false });

const props = defineProps<HighlightProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

/* `typeof` rather than `Array.isArray` — the latter does not narrow a
   `ReadonlyArray` cleanly, and the two branches are equivalent here. */
const queries = computed<Array<string>>(() =>
  (typeof props.query === 'string' ? [props.query] : [...props.query]).filter(Boolean),
);

/**
 * With no usable query React returned the raw text in a bare span; that is the
 * single non-matching segment below, so both paths share one root element.
 */
const segments = computed<Array<HighlightSegment>>(() => {
  const list = queries.value;
  if (list.length === 0) return [{ text: props.text, isMatch: false }];

  const pattern = list.map(escapeRegExp).join('|');
  const regex = new RegExp(props.isWholeWord ? `\\b(${pattern})\\b` : `(${pattern})`, 'gi');

  return props.text
    .split(regex)
    .filter((part) => part !== '')
    .map((part) => ({
      text: part,
      isMatch: list.some((q) => part.toLowerCase() === q.toLowerCase()),
    }));
});

const classes = computed(() => cn(attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <span ref="el" v-bind="rest" :class="classes">
    <template v-for="(segment, i) in segments" :key="i">
      <Mark v-if="segment.isMatch">{{ segment.text }}</Mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
