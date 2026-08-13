<script lang="ts">
export interface OnboardingChecklistTaskProps {
  /** The task label. Rich content → the `label` slot. Required in React; optional here so the slot form is usable — supply one or the other. */
  label?: string;
  /** The secondary line under the label. Rich content → the `description` slot. */
  description?: string;
  isDone?: boolean;
  /** The trailing call-to-action, hidden once done. Rich content → the `action` slot. */
  action?: string;
}
</script>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, useAttrs, useSlots, useTemplateRef } from 'vue';
import { Check } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon, type IconAdapter } from '../../../foundation/icons';
import { onboardingRegistryKey, type OnboardingTaskRecord } from './OnboardingChecklist.vue';

/**
 * `lucide-vue-next` types `size` as `24 | number`; `IconAdapterProps` widens it to
 * `number | string`, which makes the two functional-component types contravariantly
 * incompatible even though the runtime shape matches. Cast at the import boundary —
 * `foundation/icons` is outside this lane, and the real fix is narrowing
 * `IconAdapterProps['size']` there.
 */
const CheckIcon = Check as unknown as IconAdapter;

/** A single checklist row. Registers itself with the enclosing `OnboardingChecklist` so it counts toward progress. */
defineOptions({ name: 'OnboardingChecklistTask', inheritAttrs: false });

const props = withDefaults(defineProps<OnboardingChecklistTaskProps>(), { isDone: false });

const attrs = useAttrs();
const slots = useSlots();
const el = useTemplateRef<HTMLLIElement>('el');

/**
 * `isDone` is exposed as a getter so the root's progress computeds re-evaluate
 * on toggle without this task re-registering.
 */
const record: OnboardingTaskRecord = {
  get isDone() {
    return props.isDone;
  },
};

const registry = inject(onboardingRegistryKey, null);
onMounted(() => registry?.register(record));
onUnmounted(() => registry?.unregister(record));

const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description));
const hasAction = computed(() => Boolean(props.action) || Boolean(slots.action));

const classes = computed(() =>
  cn(
    'flex items-start gap-3 px-4 py-3 transition-colors',
    props.isDone && 'opacity-60',
    attrs.class as string | undefined,
  ),
);

const markerClasses = computed(() =>
  cn(
    'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border',
    props.isDone ? 'border-success bg-success text-success-foreground' : 'border-border',
  ),
);

const labelClasses = computed(() =>
  cn('text-sm font-medium text-foreground', props.isDone && 'line-through'),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <li ref="el" :data-done="props.isDone || undefined" v-bind="rest" :class="classes">
    <span aria-hidden="true" :class="markerClasses">
      <Icon v-if="props.isDone" :icon="CheckIcon" :size="12" />
    </span>
    <div class="min-w-0 flex-1">
      <div :class="labelClasses">
        <slot name="label">{{ props.label }}</slot>
      </div>
      <div v-if="hasDescription" class="mt-0.5 text-xs text-muted-foreground">
        <slot name="description">{{ props.description }}</slot>
      </div>
    </div>
    <div v-if="hasAction && !props.isDone" class="shrink-0">
      <slot name="action">{{ props.action }}</slot>
    </div>
  </li>
</template>
