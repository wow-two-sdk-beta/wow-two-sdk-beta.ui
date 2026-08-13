<script lang="ts">
import type { SurfaceTone } from '../../../foundation/utils';
import type { ContainerProps } from '../container';
import type { SectionPaddingY } from './Section.variants';

export interface SectionProps {
  /**
   * The tinted background tone for the band. Applies the shadow-less `subtle`
   * surface treatment (low-alpha tinted fill + `border-border`). Omit for a
   * transparent band (no fill, no border).
   */
  tone?: SurfaceTone;

  /** The max-width of the inner centered `Container`. Passthrough to `Container.size`. Default `lg`. */
  containerSize?: ContainerProps['size'];

  /** The vertical padding (the band's top/bottom rhythm). Default `md`. */
  py?: SectionPaddingY;

  /** The full-bleed mode — renders a `<section>` with no inner `Container` (edge-to-edge content). */
  bleed?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, surfaceVariants } from '../../../foundation/utils';
import Container from '../container/Container.vue';
import { sectionVariants } from './Section.variants';

/**
 * Full-bleed `<section>` band with an inner centered `Container`. The repetitive
 * marketing "section band" pattern: optional tinted (shadow-less) background,
 * passthrough container width, and vertical padding. Pass `bleed` to drop the
 * inner Container for edge-to-edge content.
 */
/* `<section>` is a live HTML element, but SFC templates are case-sensitive
   (`<Section>` ≠ `<section>`) and this is a library component — imported, never
   globally registered. Renaming it would break parity with the React package. */
// eslint-disable-next-line vue/no-reserved-component-names
defineOptions({ name: 'Section', inheritAttrs: false });

const props = withDefaults(defineProps<SectionProps>(), { bleed: false });

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() =>
  cn(
    sectionVariants({ py: props.py }),
    props.tone && surfaceVariants({ variant: 'subtle', tone: props.tone, radius: 'none' }),
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
  <section ref="el" v-bind="rest" :class="classes">
    <slot v-if="props.bleed" />
    <Container v-else :size="props.containerSize"><slot /></Container>
  </section>
</template>
