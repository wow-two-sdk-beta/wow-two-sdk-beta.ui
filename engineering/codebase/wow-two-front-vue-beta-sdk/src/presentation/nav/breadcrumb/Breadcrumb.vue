<script lang="ts">
export interface BreadcrumbItem {
  /** React typed this `ReactNode`; the scalar form is what an array item can carry — the `#label` scoped slot is the rich override. */
  label: string | number;

  /** Make this item a link. Last item is typically rendered as plain text. */
  href?: string;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<BreadcrumbItem>;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';

/**
 * Linear position trail — list of links + separators. The last item is
 * always rendered as `aria-current="page"` and not a link. Use the L5
 * collapsing version when the chain gets long.
 */
defineOptions({ name: 'Breadcrumb', inheritAttrs: false });

defineSlots<{
  /** The rich override for an item's `label`. */
  label?(props: { item: BreadcrumbItem; index: number }): unknown;

  /** The custom separator element. React's `separator` prop; defaults to a chevron-right icon. */
  separator?(): unknown;
}>();

const props = defineProps<BreadcrumbProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() => cn('text-sm', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

const lastIndex = computed(() => props.items.length - 1);

defineExpose({ el });
</script>

<template>
  <!-- `aria-label` sits before `v-bind="rest"` so a consumer-supplied one wins,
       the precedence React got from spreading `{...props}` after it. -->
  <nav ref="el" aria-label="Breadcrumb" v-bind="rest" :class="classes">
    <ol class="flex flex-wrap items-center gap-1.5">
      <template v-for="(item, i) in props.items" :key="i">
        <li>
          <a
            v-if="item.href && i !== lastIndex"
            :href="item.href"
            class="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <slot name="label" :item="item" :index="i">{{ item.label }}</slot>
          </a>
          <span v-else :aria-current="i === lastIndex ? 'page' : undefined" class="text-foreground">
            <slot name="label" :item="item" :index="i">{{ item.label }}</slot>
          </span>
        </li>
        <li v-if="i !== lastIndex" aria-hidden="true" class="text-subtle-foreground">
          <slot name="separator"><Icon :icon="ChevronRight" :size="14" /></slot>
        </li>
      </template>
    </ol>
  </nav>
</template>
