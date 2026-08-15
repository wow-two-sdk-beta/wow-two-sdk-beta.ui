<script lang="ts">
import type { SurfaceTone } from '../../../foundation/utils';
import type { ContainerProps } from '../container';
import type { NavbarHeight } from './Navbar.variants';

export interface NavbarProps {
  /** The max-width of the inner centered `Container`. Passthrough to `Container.size`. Default `lg`. */
  containerSize?: ContainerProps['size'];
  /** The band height. Default `md`. */
  height?: NavbarHeight;
  /** The sticky pinning of the bar to the top of the scroll container. Default `false` (non-sticky). */
  sticky?: boolean;
  /**
   * The tinted background tone for the band — applies the shadow-less `subtle`
   * surface treatment. Omit for a transparent bar (relies on `bordered` / page bg).
   */
  tone?: SurfaceTone;
  /** The bottom border under the bar. Default `true`. */
  bordered?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import { cn, surfaceVariants } from '../../../foundation/utils';
import Container from '../container/Container.vue';
import { navbarVariants } from './Navbar.variants';

/**
 * Lightweight header band (`<header>`) with `start` / `center` / `end` slots
 * laid out in a row inside a centered `Container`. The everyday "navbar +
 * centered content" need that `AppShell` (a 5-slot dashboard grid w/ sidebar)
 * overshoots. Non-sticky by default; pass `sticky` to pin it.
 */
defineOptions({ name: 'Navbar', inheritAttrs: false });

/** React's `start` / `center` / `end` / `children` ReactNode props are content regions — slots in Vue. */
defineSlots<{
  /** The leading slot — laid out at the start of the row (brand / logo / nav links). */
  start?(): unknown;
  /** The centre slot — laid out in the middle of the row (search / primary nav). */
  center?(): unknown;
  /** The trailing slot — laid out at the end of the row (actions / avatar / CTA). */
  end?(): unknown;
  /**
   * The raw row content — replaces the `start` / `center` / `end` slot layout when
   * provided. Use for fully custom bars.
   */
  default?(): unknown;
}>();

const props = withDefaults(defineProps<NavbarProps>(), { sticky: false, bordered: true });

const attrs = useAttrs();
const slots = useSlots();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() =>
  cn(
    navbarVariants({ sticky: props.sticky, height: props.height }),
    props.bordered && 'border-b border-border',
    props.tone ? surfaceVariants({ variant: 'subtle', tone: props.tone, radius: 'none' }) : 'bg-card',
    attrs.class as string | undefined,
  ),
);

/** Push `end` to the trailing edge when there's no centre slot to absorb the slack. */
const endClasses = computed(() => cn('flex min-w-0 items-center gap-3', !slots.center && 'ml-auto'));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <header ref="el" v-bind="rest" :class="classes">
    <Container :size="props.containerSize" class="flex h-full items-center gap-3">
      <slot v-if="$slots.default" />
      <template v-else>
        <div v-if="$slots.start" class="flex min-w-0 items-center gap-3">
          <slot name="start" />
        </div>
        <div v-if="$slots.center" class="flex min-w-0 flex-1 items-center justify-center gap-3">
          <slot name="center" />
        </div>
        <div v-if="$slots.end" :class="endClasses">
          <slot name="end" />
        </div>
      </template>
    </Container>
  </header>
</template>
