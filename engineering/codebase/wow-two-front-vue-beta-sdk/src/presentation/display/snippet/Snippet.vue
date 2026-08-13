<script lang="ts">
/** Defines the Snippet layout variant. */
export const SnippetVariant = {
  /** Refers to a single-line inline snippet. */
  Inline: 'inline',
  /** Refers to a multi-line block snippet. */
  Block: 'block',
} as const;

export type SnippetVariant = (typeof SnippetVariant)[keyof typeof SnippetVariant];

export interface SnippetProps {
  /** The code text to display + copy. */
  text: string;

  /** The visual variant — `inline` (single line) or `block` (multi-line). Default `inline`. */
  variant?: SnippetVariant;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { Check, Copy } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { useClipboard } from '../../../foundation/hooks';
import Code from '../code/Code.vue';

const CopiedIcon = Check;
const CopyIcon = Copy;

/**
 * Code text with a built-in copy button. Inline variant for one-liners,
 * block variant for multi-line snippets. Copy logic uses the L1
 * `useClipboard` hook directly (Snippet stays in display, can't import the
 * actions/CopyButton component).
 */
defineOptions({ name: 'Snippet', inheritAttrs: false });

const props = withDefaults(defineProps<SnippetProps>(), { variant: SnippetVariant.Inline });

const { copied, copy } = useClipboard();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn(
    'group relative inline-flex w-full items-start',
    props.variant === SnippetVariant.Inline ? 'gap-2' : 'flex-col gap-0',
    attrs.class as string | undefined,
  ),
);

const buttonClasses = computed(() =>
  cn(
    'absolute right-2 grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    props.variant === SnippetVariant.Inline ? 'top-1/2 -translate-y-1/2' : 'top-2',
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

const onCopy = (): void => {
  void copy(props.text);
};

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :class="classes">
    <Code :variant="props.variant" class="flex-1 pr-10">{{ props.text }}</Code>
    <button
      type="button"
      :aria-label="copied ? 'Copied' : 'Copy'"
      :class="buttonClasses"
      @click="onCopy"
    >
      <Icon :icon="copied ? CopiedIcon : CopyIcon" :size="14" />
    </button>
  </div>
</template>
