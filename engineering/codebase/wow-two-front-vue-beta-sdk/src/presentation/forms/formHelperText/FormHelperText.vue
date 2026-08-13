<script lang="ts">
export interface FormHelperTextProps {
  /**
   * The node's own id. An explicit id detaches it from the context's `helperId`,
   * so the control's `aria-describedby` stops referencing it.
   */
  id?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useFormControl, useFormControlChrome } from '../../../foundation/primitives';

/**
 * Helper / hint text below a form control. Takes `helperId` from `FormControl`
 * and registers itself with the context, so the control's `aria-describedby`
 * references the id only while this node actually renders.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'FormHelperText', inheritAttrs: false });

/* React took the copy as `children`; here it is the default slot. */
const props = defineProps<FormHelperTextProps>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

/* An explicit `id` prop detaches the node from the context's helperId — don't register.
   Passed as a getter so the registration re-runs if the prop changes. */
useFormControlChrome('helper', () => props.id == null);

const helperId = computed(() => props.id ?? ctx?.helperId);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn('text-sm text-muted-foreground', attrs.class as ClassValue),
);

const root = useTemplateRef<HTMLParagraphElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <p ref="root" :id="helperId" :class="rootClass" v-bind="passthroughAttrs">
    <slot />
  </p>
</template>
