<script lang="ts">
import { inject, type InjectionKey } from 'vue';

/** The value shared with `ActionSheetAction` / `ActionSheetCancel`. */
export interface ActionSheetContextValue {
  setOpen: (open: boolean) => void;
}

export const actionSheetContextKey: InjectionKey<ActionSheetContextValue> = Symbol('wow-two.actionSheet');

export function useActionSheetContext(): ActionSheetContextValue {
  const context = inject(actionSheetContextKey, null);
  if (!context) throw new Error('ActionSheet.* must be used inside <ActionSheet>');
  return context;
}

/**
 * The prop surface of `ActionSheet`.
 *
 * React's `title` / `description` were `ReactNode`; they are `string` props here
 * with matching named slots for rich content. React's `className` is the `class`
 * attr, forwarded to the panel exactly as React forwarded it.
 */
export interface ActionSheetProps {
  /** The open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;

  /** The heading above the action rows. Use the `title` slot for rich content. */
  title?: string;

  /** The supporting line under the heading. Use the `description` slot for rich content. */
  description?: string;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useSlots } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import Drawer from '../drawer/Drawer.vue';
import DrawerContent from '../drawer/DrawerContent.vue';
import OverlayTitle from '../OverlayTitle.vue';
import OverlayDescription from '../OverlayDescription.vue';

/**
 * iOS-style action sheet — opinionated bottom Drawer with stacked button rows
 * and a separated Cancel.
 */
defineOptions({ name: 'ActionSheet', inheritAttrs: false });

defineSlots<{
  /** The action rows — `ActionSheetAction` / `ActionSheetCancel`. React's `children`. */
  default(): unknown;
  /** The heading, when it is richer than the `title` string prop. */
  title?(): unknown;
  /** The supporting line, when it is richer than the `description` string prop. */
  description?(): unknown;
}>();

/** `open` / `isOpen` / the node-ish props default to `undefined` so an absent prop cannot read as a set one. */
const props = withDefaults(defineProps<ActionSheetProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  title: undefined,
  description: undefined,
});

const emit = defineEmits<{
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

const attrs = useAttrs();
const slots = useSlots();

/*
 * ActionSheet owns open state and drives Drawer fully controlled, so `setOpen`
 * works in both controlled and uncontrolled modes (Drawer's context isn't
 * interceptable).
 */
const controlled = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: () => props.defaultOpen,
  onChange: (value) => {
    emit('update:open', value);
    emit('open-change', value);
  },
});

const resolvedOpen = controlled.value;

provide(actionSheetContextKey, { setOpen: controlled.setValue });

const hasTitle = computed(() => props.title !== undefined || slots.title !== undefined);
const hasDescription = computed(() => props.description !== undefined || slots.description !== undefined);

const classes = computed(() =>
  cn('mx-auto max-w-md rounded-t-xl bg-card p-2 text-card-foreground', attrs.class as string | undefined),
);
</script>

<template>
  <Drawer :open="resolvedOpen" side="bottom" @open-change="controlled.setValue">
    <DrawerContent :class="classes">
      <div v-if="hasTitle || hasDescription" class="px-3 py-2 text-center">
        <OverlayTitle v-if="hasTitle" class="text-sm font-medium text-muted-foreground">
          <slot name="title">{{ props.title }}</slot>
        </OverlayTitle>
        <OverlayDescription v-if="hasDescription" class="mt-1 text-xs text-muted-foreground">
          <slot name="description">{{ props.description }}</slot>
        </OverlayDescription>
      </div>
      <div class="flex flex-col gap-px overflow-hidden rounded-lg bg-border">
        <slot />
      </div>
    </DrawerContent>
  </Drawer>
</template>
