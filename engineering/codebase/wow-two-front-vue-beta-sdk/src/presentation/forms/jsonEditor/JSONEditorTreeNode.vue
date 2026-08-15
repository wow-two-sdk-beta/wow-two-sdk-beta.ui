<script lang="ts">
import type { JsonPath } from './JSONEditorHelpers';

/** Internal — one row of `JSONEditor`'s tree pane. Not exported from the folder barrel. */
export interface JSONEditorTreeNodeProps {
  /** The key this node sits under; `null` at the document root. */
  keyName: string | number | null;

  /** The node's value. */
  value: unknown;

  /** The node's address inside the document. */
  path: JsonPath;

  /** The nesting depth — drives indentation and the initial open state. */
  depth: number;
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronRight, Copy } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { useFormControl } from '../../../foundation/primitives';
import { useJSONEditorContext } from './JSONEditorContext';
import { describeType, pathToString } from './JSONEditorHelpers';

defineOptions({ name: 'JSONEditorTreeNode' });

const props = defineProps<JSONEditorTreeNodeProps>();

/* The transient leaf editor is a real editing surface — the Field's helper/error
   description follows it (the input keeps its own action name). */
const ctx = useFormControl();
const editor = useJSONEditorContext();

const type = computed(() => describeType(props.value));
const isObject = computed(() => type.value === 'object' || type.value === 'array');

const open = ref(props.depth < 2);
const editing = ref(false);
const draft = ref('');

function startEdit(): void {
  if (editor.isDisabled || editor.isReadOnly || isObject.value) return;
  editing.value = true;
  draft.value = typeof props.value === 'string' ? props.value : String(props.value);
}

function commitEdit(): void {
  editing.value = false;
  if (typeof props.value === 'number') {
    const n = Number(draft.value);
    if (!Number.isNaN(n)) editor.updateAt(props.path, n);
  } else if (typeof props.value === 'boolean') {
    if (draft.value === 'true' || draft.value === 'false') {
      editor.updateAt(props.path, draft.value === 'true');
    }
  } else if (props.value === null) {
    if (draft.value === 'null') editor.updateAt(props.path, null);
  } else {
    editor.updateAt(props.path, draft.value);
  }
}

function onDraftInput(event: Event): void {
  draft.value = (event.target as HTMLInputElement).value;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') commitEdit();
  if (event.key === 'Escape') editing.value = false;
}

/* Guarded on `typeof navigator` exactly as React was; the handler is click-driven, so it is
   unreachable during SSR either way. */
function copyPath(): void {
  const text = pathToString(props.path);
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

const entries = computed<ReadonlyArray<readonly [string | number, unknown]>>(() => {
  if (!isObject.value) return [];
  if (Array.isArray(props.value)) {
    return (props.value as unknown[]).map((v, i) => [i, v] as const);
  }
  return Object.entries(props.value as Record<string, unknown>);
});

const keyLabel = computed(() => (typeof props.keyName === 'string' ? `"${props.keyName}"` : props.keyName));

const summary = computed(() =>
  Array.isArray(props.value) ? `Array(${entries.value.length})` : `Object(${entries.value.length})`,
);

const leafLabel = computed(() => (type.value === 'string' ? `"${props.value as string}"` : String(props.value)));

const copyLabel = computed(() => `Copy path ${pathToString(props.path) || 'root'}`);

const rowStyle = computed(() => ({ paddingLeft: `${props.depth * 16}px` }));

const chevronClass = computed(() => cn('transition-transform', open.value && 'rotate-90'));

const leafClass = computed(() =>
  cn(
    'cursor-text rounded-sm px-1 text-left transition-colors',
    !editor.isDisabled && !editor.isReadOnly && 'hover:bg-muted',
    type.value === 'string' && 'text-info',
    type.value === 'number' && 'text-warning',
    type.value === 'boolean' && 'text-success',
    type.value === 'null' && 'text-muted-foreground italic',
  ),
);

const ChevronIcon = ChevronRight;
const CopyIcon = Copy;
</script>

<template>
  <li role="treeitem" :aria-expanded="isObject ? open : undefined" class="px-1">
    <div class="group flex items-start gap-1 py-0.5" :style="rowStyle">
      <button
        v-if="isObject"
        type="button"
        :aria-label="open ? 'Collapse' : 'Expand'"
        class="inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
        @click="open = !open"
      >
        <Icon :icon="ChevronIcon" :size="12" :class="chevronClass" />
      </button>
      <span v-else class="inline-block h-5 w-5" />
      <span v-if="keyName !== null" class="text-foreground">
        {{ keyLabel }}<span class="text-muted-foreground">: </span>
      </span>
      <span v-if="isObject" class="text-muted-foreground">{{ summary }}</span>
      <input
        v-else-if="editing"
        autofocus
        aria-label="Edit value"
        :aria-invalid="editor.isInvalid || undefined"
        :aria-describedby="ctx?.describedBy"
        :value="draft"
        class="h-5 rounded-sm bg-background px-1 text-sm font-mono outline-none ring-2 ring-ring"
        @input="onDraftInput"
        @keydown="onKeydown"
        @blur="commitEdit"
      />
      <button v-else type="button" :class="leafClass" @click="startEdit">{{ leafLabel }}</button>
      <button
        type="button"
        :aria-label="copyLabel"
        class="ml-auto opacity-0 transition-opacity group-hover:opacity-100 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        @click="copyPath"
      >
        <Icon :icon="CopyIcon" :size="11" />
      </button>
    </div>
    <!-- Recursion by implicit self-reference: an SFC may name itself by its filename. -->
    <ul v-if="isObject && open" role="group">
      <JSONEditorTreeNode
        v-for="[k, v] in entries"
        :key="String(k)"
        :key-name="k"
        :value="v"
        :path="[...path, k]"
        :depth="depth + 1"
      />
    </ul>
  </li>
</template>
