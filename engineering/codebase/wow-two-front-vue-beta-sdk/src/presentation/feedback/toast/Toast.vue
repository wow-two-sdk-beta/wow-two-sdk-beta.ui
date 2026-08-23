<script lang="ts">
import type { Severity } from '../../../foundation/utils';

export interface ToastProps {
  /** The semantic severity palette. */
  severity?: Severity;
  /** The optional leading icon. Rich content → the `icon` slot. */
  icon?: string;
  /** The bold heading line. Rich content → the `title` slot. */
  title?: string;
  /** The body text below the title. Rich content → the `description` slot. */
  description?: string;
  /** The action area below the body. Rich content → the `actions` slot. */
  actions?: string;
  /** The accessible label for the close button. Default `"Dismiss"`. */
  closeLabel?: string;
}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs, useSlots, useTemplateRef } from 'vue';
import { X } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import ToastSimple from '../toastSimple/ToastSimple.vue';

const CloseIcon = X;

/**
 * Slotted toast — visual only (no queue / portal / lifecycle, those land
 * with `ToastHost` at L5). Pair: `ToastSimple` (atomic) + `Toast` (molecule).
 *
 * Each of React's four `ReactNode` props keeps its string form and gains a
 * same-named slot for rich content; the slot wins when both are supplied.
 */
defineOptions({ name: 'Toast', inheritAttrs: false });

const props = withDefaults(defineProps<ToastProps>(), { closeLabel: 'Dismiss' });

/** Replaces React's `onClose`; omitting `@close` omits the close button. */
const emit = defineEmits<{
  /** Fires when the close button is activated. */
  close: [];
}>();

const attrs = useAttrs();
const slots = useSlots();
const instance = getCurrentInstance();
const inner = useTemplateRef<InstanceType<typeof ToastSimple>>('inner');

/**
 * Mirrors React's `onClose && <button/>` guard — the close button renders only
 * when the consumer bound `@close`. Read through a call, not a cached computed:
 * `instance.vnode` is replaced on every re-render.
 */
const hasClose = () => Boolean(instance?.vnode.props?.onClose);

const hasIcon = computed(() => Boolean(props.icon) || Boolean(slots.icon));
const hasTitle = computed(() => Boolean(props.title) || Boolean(slots.title));
const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description));
const hasActions = computed(() => Boolean(props.actions) || Boolean(slots.actions));

const classes = computed(() => cn('flex items-start gap-3', attrs.class as string | undefined));

const descriptionClasses = computed(() => cn('text-sm', hasTitle.value && 'mt-0.5 text-muted-foreground'));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

/** Re-exposes the underlying `ToastSimple` root element, matching React's forwarded ref. */
const el = computed(() => inner.value?.el ?? null);

defineExpose({ el });
</script>

<template>
  <ToastSimple ref="inner" :severity="props.severity" v-bind="rest" :class="classes">
    <span v-if="hasIcon" class="mt-0.5 shrink-0">
      <slot name="icon">{{ props.icon }}</slot>
    </span>
    <div class="min-w-0 flex-1">
      <div v-if="hasTitle" class="font-medium">
        <slot name="title">{{ props.title }}</slot>
      </div>
      <div v-if="hasDescription" :class="descriptionClasses">
        <slot name="description">{{ props.description }}</slot>
      </div>
      <div v-if="hasActions" class="mt-2 flex flex-wrap items-center gap-2">
        <slot name="actions">{{ props.actions }}</slot>
      </div>
      <slot />
    </div>
    <button
      v-if="hasClose()"
      type="button"
      :aria-label="props.closeLabel"
      class="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      @click="emit('close')"
    >
      <Icon :icon="CloseIcon" :size="14" />
    </button>
  </ToastSimple>
</template>
