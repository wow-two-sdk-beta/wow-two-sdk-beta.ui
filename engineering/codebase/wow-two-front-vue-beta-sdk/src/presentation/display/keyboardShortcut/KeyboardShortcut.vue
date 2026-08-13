<script lang="ts">
export interface KeyboardShortcutProps {
  /** The keys in order — e.g. `['⌘', 'K']` or `['Ctrl', 'Shift', 'P']`. */
  keys: ReadonlyArray<string>;

  /** The connector between keys. Default `'+'`; pass `' '` for spaced keys. */
  separator?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import Kbd from '../kbd/Kbd.vue';

/**
 * Render a sequence of `Kbd` keys with connectors between them — e.g.
 * `<KeyboardShortcut :keys="['⌘', 'K']" />` → ⌘ + K.
 */
defineOptions({ name: 'KeyboardShortcut', inheritAttrs: false });

const props = withDefaults(defineProps<KeyboardShortcutProps>(), { separator: '+' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

const classes = computed(() =>
  cn('inline-flex items-center gap-1 text-muted-foreground', attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <span ref="el" v-bind="rest" :class="classes">
    <template v-for="(keyLabel, i) in props.keys" :key="i">
      <span v-if="i > 0" aria-hidden="true">{{ props.separator }}</span>
      <Kbd>{{ keyLabel }}</Kbd>
    </template>
  </span>
</template>
