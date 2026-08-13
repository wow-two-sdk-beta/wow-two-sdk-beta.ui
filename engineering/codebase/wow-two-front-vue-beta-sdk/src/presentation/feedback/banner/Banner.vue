<script lang="ts">
import type { Severity } from '../../../foundation/utils';

export interface BannerProps {
  /** The semantic severity palette. */
  severity?: Severity;
  /** The optional leading icon. Rich content → the `icon` slot. */
  icon?: string;
  /** The bold heading line. Rich content → the `title` slot. */
  title?: string;
  /** The body text beside the title. Rich content → the `description` slot. */
  description?: string;
  /** The right-side action area (typically Button(s)). Rich content → the `actions` slot. */
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
import BannerSimple from '../bannerSimple/BannerSimple.vue';

const CloseIcon = X;

/**
 * Slotted full-width banner. Pair with `BannerSimple` (atomic, free-form
 * children) when you don't need the structured slots.
 *
 * Each of React's four `ReactNode` props keeps its string form and gains a
 * same-named slot for rich content; the slot wins when both are supplied.
 */
defineOptions({ name: 'Banner', inheritAttrs: false });

const props = withDefaults(defineProps<BannerProps>(), { closeLabel: 'Dismiss' });

/** Replaces React's `onClose`; omitting `@close` omits the close button. */
const emit = defineEmits<{
  /** Fires when the close button is activated. */
  close: [];
}>();

const attrs = useAttrs();
const slots = useSlots();
const instance = getCurrentInstance();
const inner = useTemplateRef<InstanceType<typeof BannerSimple>>('inner');

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

const classes = computed(() => cn('flex items-center gap-4', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

/** Re-exposes the underlying `BannerSimple` root element, matching React's forwarded ref. */
const el = computed(() => inner.value?.el ?? null);

defineExpose({ el });
</script>

<template>
  <BannerSimple ref="inner" :severity="props.severity" v-bind="rest" :class="classes">
    <span v-if="hasIcon" class="shrink-0">
      <slot name="icon">{{ props.icon }}</slot>
    </span>
    <div class="flex min-w-0 flex-1 items-baseline gap-3">
      <span v-if="hasTitle" class="font-medium">
        <slot name="title">{{ props.title }}</slot>
      </span>
      <span v-if="hasDescription" class="opacity-90">
        <slot name="description">{{ props.description }}</slot>
      </span>
      <slot />
    </div>
    <div v-if="hasActions" class="flex shrink-0 items-center gap-2">
      <slot name="actions">{{ props.actions }}</slot>
    </div>
    <button
      v-if="hasClose()"
      type="button"
      :aria-label="props.closeLabel"
      class="-mr-2 grid h-7 w-7 shrink-0 place-items-center rounded text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
      @click="emit('close')"
    >
      <Icon :icon="CloseIcon" :size="16" />
    </button>
  </BannerSimple>
</template>
