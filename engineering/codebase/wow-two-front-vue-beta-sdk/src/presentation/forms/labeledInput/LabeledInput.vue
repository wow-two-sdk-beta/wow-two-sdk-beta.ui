<script lang="ts">
/** @deprecated Prefer `Field` (was `FormField`) or compose `Label` + a control directly. */
export interface LabeledInputProps {
  /** The label text. Fill the `label` slot instead for richer content. */
  label?: string | number;

  /** The optional inline-end label (e.g. "Optional"). Fill the `trailing` slot for richer content. */
  trailing?: string | number;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import Label from '../label/Label.vue';

/**
 * Lighter alternative to `Field` — just `Label` + control, no helper / error /
 * context wiring. Good for compact inline forms.
 *
 * @deprecated Prefer `Field` (was `FormField`) for label + control + helper/error,
 * or compose `Label` + a control directly. Kept for one release.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'LabeledInput', inheritAttrs: false });

const props = defineProps<LabeledInputProps>();

/*
 * React reached into `children.props.id` and re-cloned the element with a generated id.
 * Vue has no vnode-prop read at that point, so the default slot is SCOPED instead: the
 * generated id is handed to the consumer, who binds it on their control.
 */
defineSlots<{
  default(props: { id: string }): unknown;
  label?(): unknown;
  trailing?(): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();

const generatedId = useId();

const hasTrailing = computed(() => Boolean(props.trailing) || Boolean(slots.trailing));

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn('flex flex-col gap-1.5', attrs.class as ClassValue));

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <div class="flex items-center justify-between">
      <Label :for="generatedId">
        <slot name="label">{{ label }}</slot>
      </Label>
      <span v-if="hasTrailing" class="text-xs text-muted-foreground">
        <slot name="trailing">{{ trailing }}</slot>
      </span>
    </div>
    <slot :id="generatedId" />
  </div>
</template>
