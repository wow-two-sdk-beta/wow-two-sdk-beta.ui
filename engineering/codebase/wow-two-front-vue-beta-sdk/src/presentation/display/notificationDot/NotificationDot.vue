<script lang="ts">
import type { CornerPosition } from '../../../foundation/utils';

/** Defines the NotificationDot color tone. */
export const NotificationDotTone = {
  /** Refers to the destructive / error color. */
  Destructive: 'destructive',
  /** Refers to the positive / confirmation color. */
  Success: 'success',
  /** Refers to the caution color. */
  Warning: 'warning',
  /** Refers to the informational color. */
  Info: 'info',
  /** Refers to the primary brand color. */
  Primary: 'primary',
  /** Refers to the neutral color. */
  Neutral: 'neutral',
} as const;

export type NotificationDotTone =
  (typeof NotificationDotTone)[keyof typeof NotificationDotTone];

/** Defines the NotificationDot size step. */
export const NotificationDotSize = {
  /** Refers to the extra-small dot. */
  Xs: 'xs',
  /** Refers to the small dot. */
  Sm: 'sm',
  /** Refers to the medium dot. */
  Md: 'md',
} as const;

export type NotificationDotSize =
  (typeof NotificationDotSize)[keyof typeof NotificationDotSize];

export interface NotificationDotProps {
  /** The color tone. Default `destructive`. */
  tone?: NotificationDotTone;

  /** The size step. Default `sm`. */
  size?: NotificationDotSize;

  /** The pulsing ring around the dot. */
  hasPulse?: boolean;

  /** The corner position — when set, the dot is positioned absolutely relative to its parent. */
  position?: CornerPosition;
}

const TONE: Record<NotificationDotTone, string> = {
  destructive: 'bg-destructive',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  primary: 'bg-primary',
  neutral: 'bg-muted-foreground',
};

/* Static literal map — Tailwind must see the complete `after:bg-*` class names. */
const PULSE_TONE: Record<NotificationDotTone, string> = {
  destructive: 'after:bg-destructive',
  success: 'after:bg-success',
  warning: 'after:bg-warning',
  info: 'after:bg-info',
  primary: 'after:bg-primary',
  neutral: 'after:bg-muted-foreground',
};

const SIZE: Record<NotificationDotSize, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
};

const POS: Record<CornerPosition, string> = {
  'top-right': 'absolute -top-0.5 -right-0.5',
  'top-left': 'absolute -top-0.5 -left-0.5',
  'bottom-right': 'absolute -bottom-0.5 -right-0.5',
  'bottom-left': 'absolute -bottom-0.5 -left-0.5',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Tiny colored dot — unread/notification indicator. Pass `position` to
 * absolutely-place over a parent (e.g. on an Avatar or `<Button shape="square"/circle">`).
 */
defineOptions({ name: 'NotificationDot', inheritAttrs: false });

const props = withDefaults(defineProps<NotificationDotProps>(), {
  tone: 'destructive',
  size: 'sm',
  hasPulse: undefined,
  position: undefined,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

const classes = computed(() =>
  cn(
    'inline-flex rounded-full ring-2 ring-background',
    TONE[props.tone],
    SIZE[props.size],
    /* `relative` anchors the ::after ring; POS comes later so its `absolute` wins when positioned. */
    props.hasPulse &&
      `relative after:absolute after:inset-0 after:animate-ping after:rounded-full after:opacity-75 after:content-[""] ${PULSE_TONE[props.tone]}`,
    props.position && POS[props.position],
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
  <span ref="el" aria-hidden="true" v-bind="rest" :class="classes" />
</template>
