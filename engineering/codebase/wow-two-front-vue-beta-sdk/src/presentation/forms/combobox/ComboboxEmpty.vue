<script lang="ts">
/* No props: React typed this as bare `HTMLAttributes<HTMLDivElement>`, every member of which is
   a Vue fallthrough attr, and the message itself is the default slot. The block exists because
   a `<script setup>`-only SFC loses `ignoreRestSiblings` in `vue-eslint-parser` and trips
   `no-unused-vars` on the house `const { class: _class, ...others }` idiom. */
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { listboxEmptyVariants } from '../listbox/Listbox.variants';

/**
 * Provides the message shown when no options match. Rendered as a disabled option, not
 * `presentation`: a `listbox` must own at least one `option`/`group` (axe
 * aria-required-children), and this keeps the message perceivable to AT. Never registered,
 * so keyboard nav / aria-activedescendant skip it.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ComboboxEmpty', inheritAttrs: false });

const attrs = useAttrs();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn(listboxEmptyVariants(), attrs.class as ClassValue));
</script>

<template>
  <div role="option" aria-disabled="true" :aria-selected="false" :class="rootClass" v-bind="passthroughAttrs">
    <slot />
  </div>
</template>
