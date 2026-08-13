<script lang="ts">
export interface TreeItemProps {
  /** The leaf value — the key selection is tracked under. */
  value: string;
  /** The disabled state. Default `false`. */
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useTreeContext, useTreeLevel } from './TreeContext';
import TreeNodeRow from './TreeNodeRow.vue';

/** A selectable leaf. React shipped it as `Tree.Item`. */
defineOptions({ name: 'TreeItem', inheritAttrs: false });

/** The leaf label — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<TreeItemProps>(), { isDisabled: false });

const attrs = useAttrs();
const el = useTemplateRef<HTMLLIElement>('el');
const tree = useTreeContext();
const treeLevel = useTreeLevel();

const isSelected = computed(() => tree.selectedValue === props.value);

function activate(): void {
  tree.setSelectedValue(props.value);
}

const classes = computed(() => cn('list-none', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <li ref="el" role="presentation" v-bind="rest" :class="classes">
    <TreeNodeRow
      :level="treeLevel.level"
      :is-selected="isSelected"
      :has-children="false"
      :is-disabled="isDisabled"
      :on-activate="activate"
    >
      <slot />
    </TreeNodeRow>
  </li>
</template>
