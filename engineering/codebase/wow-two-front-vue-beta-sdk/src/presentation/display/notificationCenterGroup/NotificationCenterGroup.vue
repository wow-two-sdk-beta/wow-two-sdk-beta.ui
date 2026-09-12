<script lang="ts">
export interface NotificationCenterGroupProps {
  /** The header title. Default `"Notifications"`. Rich content → the `title` slot. */
  readonly title?: string;

  /** The badge / count rendered next to the title. Rich content → the `count` slot. */
  readonly count?: string | number;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import { Bell } from 'lucide-vue-next';
import { cn, surfaceVariants } from '../../../foundation/styles';
import { renderableChildren } from '../../../foundation/primitives';

/**
 * Renders a notification panel — title and count header, a scrolling item list, optional footer.
 * The default slot holds `NotificationItem` children.
 *
 * React's `headerActions` / `emptyState` / `footer` were `ReactNode` props with
 * no string form worth keeping; they are slots only. `title` / `count` keep
 * their prop form and gain same-named slots.
 */
defineOptions({ name: 'NotificationCenterGroup', inheritAttrs: false });

const props = withDefaults(defineProps<NotificationCenterGroupProps>(), { title: 'Notifications' });

defineSlots<{
  /** The `NotificationItem` children filling the scrolling list. */
  default?(): unknown;
  /** The header title. Falls back to the `title` prop. */
  title?(): unknown;
  /** The header badge. Falls back to the `count` prop. */
  count?(): unknown;
  /** The controls at the right of the header. */
  headerActions?(): unknown;
  /** Replaces the built-in "all caught up" placeholder shown with no items. */
  emptyState?(): unknown;
  /** The footer band under the list. Omitting it drops the band. */
  footer?(): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();
const el = useTemplateRef<HTMLDivElement>('el');

/**
 * Replaces React's `Children.toArray(children).filter(isValidElement)`. Called
 * per render rather than cached — a slot's content is only knowable at render
 * time, and `renderableChildren` drops the comment/whitespace vnodes that would
 * otherwise read as content.
 */
const isEmpty = () => renderableChildren(slots.default?.()).length === 0;

const classes = computed(() =>
  cn('flex w-80 flex-col', surfaceVariants({ variant: 'surface', radius: 'md' }), attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" role="region" aria-label="Notifications" v-bind="rest" :class="classes">
    <header class="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold">
          <slot name="title">{{ props.title }}</slot>
        </span>
        <span
          v-if="props.count != null || $slots.count"
          class="inline-flex items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-5 text-primary-foreground"
        >
          <slot name="count">{{ props.count }}</slot>
        </span>
      </div>
      <slot name="headerActions" />
    </header>
    <div class="max-h-96 overflow-y-auto py-1">
      <template v-if="isEmpty()">
        <slot name="emptyState">
          <div class="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
            <Bell class="h-6 w-6" />
            <p class="text-sm">You're all caught up.</p>
          </div>
        </slot>
      </template>
      <div v-else class="flex flex-col"><slot /></div>
    </div>
    <div v-if="$slots.footer" class="border-t border-border px-3 py-2 text-center text-xs">
      <slot name="footer" />
    </div>
  </div>
</template>
