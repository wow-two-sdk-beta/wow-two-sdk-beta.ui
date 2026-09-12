<script lang="ts">
import type { ModalContentProps } from '../modal';

/** The prop surface of `AlertModalContent` — identical to `ModalContent`'s. */
export type AlertModalContentProps = ModalContentProps;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type ComponentPublicInstance } from 'vue';
import ModalContent from '../modal/ModalContent.vue';

/** Renders the alert dialog's panel — `ModalContent` verbatim; the alert semantics live on the root. */
defineOptions({ name: 'AlertModalContent', inheritAttrs: false });

/** The panel content — chrome subcomponents and the dialog body. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<AlertModalContentProps>();

const attrs = useAttrs();
const inner = useTemplateRef<ComponentPublicInstance & { el?: unknown }>('inner');

/** Declared props first, attrs (including `class`) after, so a caller's attribute wins — React's spread order. */
const forwarded = computed(() => ({ ...props, ...attrs }));

const el = computed(() => (inner.value?.$el ?? null) as HTMLElement | null);

defineExpose({ el });
</script>

<template>
  <ModalContent ref="inner" v-bind="forwarded"><slot /></ModalContent>
</template>
