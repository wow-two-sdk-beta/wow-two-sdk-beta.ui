<script lang="ts">
/** Internal — the tree pane of `JSONEditor`. Not exported from the folder barrel. */
export interface JSONEditorTreeViewProps {
  /** The document rendered as a tree. */
  value: unknown;
}
</script>

<script setup lang="ts">
import { useFormControl } from '../../../foundation/primitives';
import { useJSONEditorContext } from './JSONEditorContext';
import JSONEditorTreeNode from './JSONEditorTreeNode.vue';

defineOptions({ name: 'JSONEditorTreeView' });

defineProps<JSONEditorTreeViewProps>();

/* In tree mode the tree IS the editing surface — it carries the context id
   (label anchor) and is named/described by the Field chrome. */
const ctx = useFormControl();
const editor = useJSONEditorContext();
</script>

<template>
  <ul
    role="tree"
    :id="ctx?.id"
    :aria-labelledby="ctx?.labelledBy"
    :aria-describedby="ctx?.describedBy"
    :aria-invalid="editor.isInvalid || undefined"
    class="font-mono text-sm"
  >
    <JSONEditorTreeNode :key-name="null" :value="value" :path="[]" :depth="0" />
  </ul>
</template>
