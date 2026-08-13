<script lang="ts">
export interface FieldProps {
  /** The label text. Fill the `label` slot instead for richer content (e.g. label + tooltip). */
  label?: string | number;

  /** The helper / hint shown beneath the control. Hidden while errors show. */
  helper?: string | number;

  /**
   * The error text — renders only when truthy. Sets `isInvalid` on the form context.
   * Inside a forms-engine `Field` this is an OVERRIDE: leave it unset and the
   * field's own errors (client + server, all of them) render automatically.
   */
  error?: string | number;

  /** The required state (also exposes `isRequired` to the control via context). */
  isRequired?: boolean;

  /** The disabled state (also exposes `isDisabled` to the control). */
  isDisabled?: boolean;

  /** The read-only state (also exposes `isReadOnly` to the control). */
  isReadOnly?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { FormControlProvider, useFormControl } from '../../../foundation/primitives';
import Label from '../label/Label.vue';
import FormHelperText from '../formHelperText/FormHelperText.vue';
import FormErrorMessage from '../formErrorMessage/FormErrorMessage.vue';

/**
 * One-stop label + control + helper + error wrapper. Wraps the default slot in a
 * `FormControlProvider` so the inner control auto-wires `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, `required`, `readOnly`.
 *
 * Form-aware: composed inside a forms-engine `Field` it ADOPTS the glue's context
 * instead of shadowing it — same ids, inherited `isInvalid`/flags, and the field's
 * errors render without hand-wiring (`error` stays as an override). Standalone (no
 * surrounding provider) it behaves exactly as before.
 *
 * Each of React's three `ReactNode` props keeps its scalar form and gains a
 * same-named slot for richer content; the prop stays the discriminator.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Field', inheritAttrs: false });

const props = withDefaults(defineProps<FieldProps>(), {
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the PARENT
     context's value, and Vue's Boolean casting would turn an absent prop into an explicit
     `false` that shadows the parent instead of deferring to it. */
  isRequired: undefined,
  isDisabled: undefined,
  isReadOnly: undefined,
});

/** The single form control (TextInput, Select, …) — receives wired id/aria via context. */
defineSlots<{
  default(): unknown;
  label?(): unknown;
  helper?(): unknown;
  error?(): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();

/* `parent` is a live-getter object — read fields off it, never destructure. */
const parent = useFormControl();

const hasLabel = computed(() => Boolean(props.label) || Boolean(slots.label));
const hasHelper = computed(() => Boolean(props.helper) || Boolean(slots.helper));
const hasOwnError = computed(() => Boolean(props.error) || Boolean(slots.error));

/* Mirrors FormErrorMessage's visibility so the helper never hides behind an error
   that won't render. */
const showError = computed(
  () =>
    hasOwnError.value ||
    ((parent?.errors?.length ?? 0) > 0 && (parent?.isInvalid ?? false)),
);

const parentId = computed(() => parent?.id);
const parentErrors = computed(() => parent?.errors);
const isInvalid = computed(() => hasOwnError.value || (parent?.isInvalid ?? false));
const isRequired = computed(() => props.isRequired ?? parent?.isRequired);
const isDisabled = computed(() => props.isDisabled ?? parent?.isDisabled);
const isReadOnly = computed(() => props.isReadOnly ?? parent?.isReadOnly);

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
  <FormControlProvider
    :id="parentId"
    :errors="parentErrors"
    :is-invalid="isInvalid"
    :is-required="isRequired"
    :is-disabled="isDisabled"
    :is-read-only="isReadOnly"
  >
    <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
      <Label v-if="hasLabel">
        <slot name="label">{{ label }}</slot>
      </Label>

      <slot />

      <FormErrorMessage v-if="showError" :message="hasOwnError ? error : undefined">
        <!-- Passed only when this Field owns the error: an always-present default slot
             would read as an override and suppress the context's own `errors`. -->
        <template v-if="hasOwnError && $slots.error" #default>
          <slot name="error" />
        </template>
      </FormErrorMessage>
      <FormHelperText v-else-if="hasHelper">
        <slot name="helper">{{ helper }}</slot>
      </FormHelperText>
    </div>
  </FormControlProvider>
</template>
