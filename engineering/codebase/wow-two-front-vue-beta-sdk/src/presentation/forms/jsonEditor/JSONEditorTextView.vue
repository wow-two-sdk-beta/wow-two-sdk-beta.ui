<script lang="ts">
/** Internal — the raw-text pane of `JSONEditor`. Not exported from the folder barrel. */
export interface JSONEditorTextViewProps {
  /** The document rendered as pretty-printed JSON. */
  value: unknown;

  /** The `JSON.stringify` indent. */
  indent: number;
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { cn } from '../../../foundation/utils';
import { useFormControl } from '../../../foundation/primitives';
import { useJSONEditorContext } from './JSONEditorContext';
import { safeStringify } from './JSONEditorHelpers';

defineOptions({ name: 'JSONEditorTextView' });

const props = defineProps<JSONEditorTextViewProps>();

const emit = defineEmits<{
  /** Fires with the parsed document when the draft commits. */
  commit: [value: unknown];
}>();

/* In text mode the raw textarea is the editing surface — it takes the context id
   (Label `for` target) and the Field label overrides the generic fallback name. */
const ctx = useFormControl();
const editor = useJSONEditorContext();

const initial = computed(() => safeStringify(props.value, props.indent));

const draft = ref(initial.value);
const error = ref<string | null>(null);
const dirty = ref(false);

// Re-sync when external value changes (when not actively editing).
watch(initial, (next) => {
  if (!dirty.value) draft.value = next;
});

function commit(): void {
  try {
    const parsed: unknown = JSON.parse(draft.value);
    error.value = null;
    emit('commit', parsed);
    dirty.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Invalid JSON';
  }
}

function onInput(event: Event): void {
  dirty.value = true;
  draft.value = (event.target as HTMLTextAreaElement).value;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    draft.value = initial.value;
    error.value = null;
    dirty.value = false;
  }
}

const textareaClass = computed(() =>
  cn(
    'flex-1 resize-none whitespace-pre bg-transparent p-3 font-mono text-sm outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed',
    error.value && 'text-foreground',
  ),
);
</script>

<template>
  <div class="flex h-full flex-col">
    <textarea
      :id="ctx?.id"
      aria-label="JSON source"
      :aria-labelledby="ctx?.labelledBy"
      :aria-invalid="editor.isInvalid || undefined"
      :aria-describedby="ctx?.describedBy"
      :value="draft"
      :disabled="editor.isDisabled"
      :readonly="editor.isReadOnly"
      :spellcheck="false"
      :class="textareaClass"
      @input="onInput"
      @blur="commit"
      @keydown="onKeydown"
    />
    <div
      v-if="error"
      role="alert"
      class="border-t border-destructive bg-destructive-soft px-3 py-2 text-xs text-destructive"
    >
      {{ error }}
    </div>
  </div>
</template>
