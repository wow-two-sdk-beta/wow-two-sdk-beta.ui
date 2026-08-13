<script lang="ts">
import type { Orientation } from '../../../foundation/utils';
import type { TabsActivationMode } from './TabsContext';

export interface TabsProps {
  /** The controlled active tab value. */
  value?: string;
  /** The uncontrolled initial tab value. */
  defaultValue?: string;
  /** The layout axis. Default `horizontal`. */
  orientation?: Orientation;
  /** Whether focus alone activates a tab. Default `automatic`. */
  activationMode?: TabsActivationMode;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn, Orientation as OrientationValue } from '../../../foundation/utils';
import { useControlled, useId } from '../../../foundation/hooks';
import {
  TabsActivationMode as TabsActivationModeValue,
  TabsKey,
  type TabsContextValue,
} from './TabsContext';

/**
 * Tabs root. Owns the active value and publishes it to `TabsList` / `TabsTab` /
 * `TabsPanel` through injection — React attached those as `Tabs.List` / `.Tab` /
 * `.Panel` statics, which an SFC's default export cannot carry.
 */
defineOptions({ name: 'Tabs', inheritAttrs: false });

/** The tablist and panels — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<TabsProps>(), {
  value: undefined,
  defaultValue: undefined,
  orientation: OrientationValue.Horizontal,
  activationMode: TabsActivationModeValue.Automatic,
});

const emit = defineEmits<{
  /** Fires with the newly selected tab value. */
  'value-change': [value: string];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const { value: active, setValue: setActive } = useControlled<string>({
  controlled: () => props.value,
  default: props.defaultValue ?? '',
  onChange: (next) => emit('value-change', next),
});

const baseId = useId();

/* Live getters, not a snapshot — an orientation or activation-mode change on
   the root has to reach every already-mounted tab. */
provide<TabsContextValue>(TabsKey, {
  get value() {
    return active.value;
  },
  setValue: setActive,
  get orientation() {
    return props.orientation;
  },
  get activationMode() {
    return props.activationMode;
  },
  baseId,
});

const classes = computed(() =>
  cn(
    props.orientation === OrientationValue.Vertical ? 'flex gap-2' : 'flex flex-col gap-2',
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
  <div ref="el" :data-orientation="orientation" v-bind="rest" :class="classes"><slot /></div>
</template>
