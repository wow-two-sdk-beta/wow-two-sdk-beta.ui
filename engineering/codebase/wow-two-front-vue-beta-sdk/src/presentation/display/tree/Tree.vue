<script lang="ts">
export interface TreeProps {
  /** The controlled selected leaf value. */
  selectedValue?: string | null;
  /** The uncontrolled initial selected leaf value. */
  defaultSelectedValue?: string | null;
  /** The controlled expanded branch values. */
  expanded?: ReadonlyArray<string>;
  /** The uncontrolled initial expanded branch values. */
  defaultExpanded?: ReadonlyArray<string>;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { RovingFocusGroup } from '../../../foundation/primitives';
import { TreeKey, type TreeContextValue } from './TreeContext';

/**
 * Tree root. Owns selection + expansion and publishes them to `TreeGroup` /
 * `TreeItem` through injection — React attached those as `Tree.Group` / `.Item`
 * statics, which an SFC's default export cannot carry.
 */
defineOptions({ name: 'Tree', inheritAttrs: false });

/** The `TreeGroup` / `TreeItem` children — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<TreeProps>(), {
  selectedValue: undefined,
  defaultSelectedValue: undefined,
  expanded: undefined,
  defaultExpanded: undefined,
});

const emit = defineEmits<{
  /** Fires with the newly selected leaf value. */
  'selection-change': [value: string];
  /** Fires with the full expanded-branch list after a toggle. */
  'expanded-change': [values: ReadonlyArray<string>];
}>();

const attrs = useAttrs();
const el = useTemplateRef<InstanceType<typeof RovingFocusGroup>>('el');

const { value: selected, setValue: setSelected } = useControlled<string | null>({
  controlled: () => props.selectedValue,
  default: props.defaultSelectedValue ?? null,
  /* Only ever called with a string — `setSelectedValue` is the single writer. */
  onChange: (next) => emit('selection-change', next as string),
});

const { value: expandedList, setValue: setExpandedList } = useControlled<ReadonlyArray<string>>({
  controlled: () => props.expanded,
  default: props.defaultExpanded ?? [],
  onChange: (next) => emit('expanded-change', next),
});

const expandedSet = computed(() => new Set(expandedList.value));

function toggleExpanded(value: string): void {
  const next = new Set(expandedSet.value);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  setExpandedList(Array.from(next));
}

/* Live getters, not a snapshot — selection and expansion have to reach every
   already-mounted row. */
provide<TreeContextValue>(TreeKey, {
  get selectedValue() {
    return selected.value;
  },
  setSelectedValue: setSelected,
  get expanded() {
    return expandedSet.value;
  },
  toggleExpanded,
});

const classes = computed(() => cn('flex flex-col text-sm', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <RovingFocusGroup ref="el" orientation="vertical" can-loop role="tree" v-bind="rest" :class="classes">
    <slot />
  </RovingFocusGroup>
</template>
