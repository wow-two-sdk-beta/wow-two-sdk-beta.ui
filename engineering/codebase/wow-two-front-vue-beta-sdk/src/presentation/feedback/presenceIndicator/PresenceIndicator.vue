<script lang="ts">
import type { CornerPosition, Size } from '../../../foundation/utils';

/** Defines a person's presence state. */
export const PresenceStatus = {
  /** Refers to actively available. */
  Online: 'online',
  /** Refers to present but inactive. */
  Idle: 'idle',
  /** Refers to present but do-not-disturb. */
  Busy: 'busy',
  /** Refers to not connected. */
  Offline: 'offline',
  /** Refers to connected but appearing offline. */
  Invisible: 'invisible',
} as const;

export type PresenceStatus = (typeof PresenceStatus)[keyof typeof PresenceStatus];

export interface PresenceIndicatorProps {
  status?: PresenceStatus;
  /** The dot diameter. */
  size?: Size;

  /** The pulsing-ring toggle (only meaningful for `online`). */
  hasPulse?: boolean;

  /** The corner position on a parent (use inside an Avatar wrapper). */
  position?: CornerPosition;

  /** The accessible-label override. Defaults to status name. */
  label?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, Size as SizeToken } from '../../../foundation/utils';

const STATUS_BG: Record<PresenceStatus, string> = {
  online: 'bg-success',
  idle: 'bg-warning',
  busy: 'bg-destructive',
  offline: 'bg-muted-foreground',
  invisible: 'bg-transparent border border-muted-foreground',
};

/* Only xs/sm/md/lg carry a dot size; other `Size` members fall through to `sm`. */
const SIZE: Partial<Record<Size, string>> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const POS: Record<CornerPosition, string> = {
  'top-right': 'absolute top-0 right-0',
  'top-left': 'absolute top-0 left-0',
  'bottom-right': 'absolute bottom-0 right-0',
  'bottom-left': 'absolute bottom-0 left-0',
};

const STATUS_LABEL: Record<PresenceStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  busy: 'Busy',
  offline: 'Offline',
  invisible: 'Invisible',
};

/**
 * Colored dot encoding a person's presence (online / idle / busy / offline /
 * invisible). Includes a `ring-background` so it pops cleanly when overlaid
 * on an `Avatar`. Pass `position` to absolutely place on a positioned parent.
 */
defineOptions({ name: 'PresenceIndicator', inheritAttrs: false });

const props = withDefaults(defineProps<PresenceIndicatorProps>(), {
  status: PresenceStatus.Online,
  size: SizeToken.Sm,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

const showPulse = computed(() => Boolean(props.hasPulse) && props.status === PresenceStatus.Online);

const classes = computed(() =>
  cn(
    'inline-flex rounded-full ring-2 ring-background',
    STATUS_BG[props.status],
    SIZE[props.size] ?? SIZE.sm,
    props.position && POS[props.position],
    'relative',
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
  <span
    ref="el"
    role="status"
    :aria-label="props.label ?? STATUS_LABEL[props.status]"
    :data-status="props.status"
    v-bind="rest"
    :class="classes"
  >
    <span
      v-if="showPulse"
      aria-hidden="true"
      :class="cn('absolute inset-0 rounded-full opacity-75 motion-safe:animate-ping', STATUS_BG.online)"
    />
  </span>
</template>
