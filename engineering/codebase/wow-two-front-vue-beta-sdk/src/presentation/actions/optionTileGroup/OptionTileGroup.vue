<script lang="ts">
import type { Align } from '../../../foundation/utils';

/** Defines props for a group of option tiles. */
export interface OptionTileGroupProps {
  /** The group's accessible name. */
  readonly label: string;

  /** The disabled state — greys + blocks every tile via a native `<fieldset disabled>`. */
  readonly disabled?: boolean;

  /** The wrap state — tiles flow onto multiple rows. Default `false` (single row). */
  readonly wrap?: boolean;

  /** The main-axis alignment of the tiles. Default `start`. */
  readonly align?: Align;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { optionTileGroupVariants } from './OptionTileGroup.variants';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'OptionTileGroup', inheritAttrs: false });

/* `children` has no prop counterpart — the `OptionTile` children are the default slot — and the
   React `className` prop is Vue's `class` fallthrough attr. */
/* Explicit `undefined` defaults keep Vue's boolean casting from turning an absent prop into
   `false` — `wrap` must stay undefined so the variants config's own default decides. */
const props = withDefaults(defineProps<OptionTileGroupProps>(), {
  disabled: undefined,
  wrap: undefined,
});

const attrs = useAttrs();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    /* The React original composed `presentation/forms`' `Fieldset`, whose whole body is this reset.
       That group has not ported yet, so the reset is inlined onto a native `<fieldset>`; swap the
       element back for `<Fieldset>` once `forms/fieldset` lands. */
    'm-0 min-w-0 border-0 p-0',
    optionTileGroupVariants({ wrap: props.wrap, align: props.align }),
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLFieldSetElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <!--
    Renders a labelled group of `OptionTile`s — a reset `<fieldset>` (native
    `disabled` greys + blocks the whole group) laid out as a tile row, with the
    group's accessible name on `aria-label`.
  -->
  <fieldset
    ref="root"
    :disabled="disabled"
    :aria-label="label"
    :class="rootClass"
    v-bind="passthroughAttrs"
  >
    <slot />
  </fieldset>
</template>
