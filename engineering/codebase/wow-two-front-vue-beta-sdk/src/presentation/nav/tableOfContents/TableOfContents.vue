<script lang="ts">
export interface TableOfContentsItem {
  readonly id: string;

  /** The item's label — scalar; an array item carries no rich content. The `#label` slot is the rich override. */
  readonly label: string | number;

  /** Indent level. 0 = top, 1 = nested, … */
  readonly depth?: number;
}

export interface TableOfContentsProps {
  readonly items?: ReadonlyArray<TableOfContentsItem>;

  /**
   * The element whose headings are auto-extracted. React took a `RefObject`;
   * Vue template refs unwrap to the element itself, so pass the element
   * (`sourceRef` from `useTemplateRef`).
   */
  readonly source?: HTMLElement | null;

  /** The CSS selector used with `source`. Default `h2, h3`. */
  readonly headingSelector?: string;

  /** The override for the auto-derived active id. `undefined` keeps the derived value. */
  readonly activeId?: string | null;

  /** The sticky toggle — applies `sticky top-4 self-start` helper classes. */
  readonly isSticky?: boolean;
}

function depthFromTagName(tag: string): number {
  const match = /^H([1-6])$/i.exec(tag);
  return match ? Number(match[1]) - 2 : 0; // h2 → 0, h3 → 1, h4 → 2
}
</script>

<script setup lang="ts">
import { computed, shallowRef, useAttrs, useTemplateRef, watch } from 'vue';
import { cn } from '../../../foundation/styles';
import { useScrollSpy } from '../scrollSpy/UseScrollSpy';

/**
 * Renders an outline of headings, taken from `items` (explicit) or `source` (auto-extracted).
 * The active entry is derived from `useScrollSpy` over the headings' IDs.
 */
defineOptions({ name: 'TableOfContents', inheritAttrs: false });

defineSlots<{
  /** The rich override for an item's `label`. */
  label?(props: { item: TableOfContentsItem; index: number }): unknown;
}>();

/** `activeId` defaults to `undefined` — the tri-state that lets an absent prop mean "derive it". */
const props = withDefaults(defineProps<TableOfContentsProps>(), {
  headingSelector: 'h2, h3',
  activeId: undefined,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const extracted = shallowRef<ReadonlyArray<TableOfContentsItem>>([]);

watch(
  [() => props.items, () => props.source, () => props.headingSelector],
  ([itemsProp, source, headingSelector]) => {
    if (itemsProp || !source) return;
    const headings = Array.from(source.querySelectorAll<HTMLElement>(headingSelector));
    extracted.value = headings
      .filter((h) => h.id)
      .map((h) => ({
        id: h.id,
        label: h.textContent ?? '',
        depth: Math.max(0, depthFromTagName(h.tagName)),
      }));
  },
  { immediate: true, flush: 'post' },
);

const items = computed(() => props.items ?? extracted.value);
const ids = computed(() => items.value.map((i) => i.id));
const spyId = useScrollSpy(() => ids.value);
const activeId = computed(() => (props.activeId !== undefined ? props.activeId : spyId.value));

const classes = computed(() => cn(props.isSticky && 'sticky top-4 self-start', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- React returned `null` for an empty outline; `v-if` is the same gate. -->
  <nav v-if="items.length > 0" ref="el" aria-label="Table of contents" v-bind="rest" :class="classes">
    <ul class="space-y-1 text-sm">
      <li v-for="(item, i) in items" :key="item.id" :style="{ paddingLeft: `${(item.depth ?? 0) * 12}px` }">
        <a
          :href="`#${item.id}`"
          :aria-current="item.id === activeId ? 'location' : undefined"
          :class="
            cn(
              'block rounded-sm px-2 py-1 transition-colors',
              item.id === activeId
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
            )
          "
        >
          <slot name="label" :item="item" :index="i">{{ item.label }}</slot>
        </a>
      </li>
    </ul>
  </nav>
</template>
