<script lang="ts">
import type { JSONEditorMode } from './JSONEditorContext';

export interface JSONEditorProps {
  /** The document, controlled — React's spelling, which wins when both are set. */
  value?: unknown;

  /** The document, controlled. The `v-model` binding target. */
  modelValue?: unknown;

  /** The initial document when uncontrolled. Defaults to `{}`. */
  defaultValue?: unknown;

  /** The render mode, controlled. The `v-model:mode` binding target. */
  mode?: JSONEditorMode;

  /** The initial render mode when uncontrolled. Default `tree`. */
  defaultMode?: JSONEditorMode;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The read-only state. Falls back to the surrounding form control's `isReadOnly`. */
  isReadOnly?: boolean;

  /** The invalid surface override. Falls back to the surrounding form control's `isInvalid`. */
  isInvalid?: boolean;

  /** The `JSON.stringify` indent used by text mode. Default `2`. */
  indent?: number;

  /** The CSS minHeight on the surface (default `14rem`). */
  minHeight?: string;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import {
  JSONEditorKey,
  JSONEditorMode as JSONEditorModeValue,
  type JSONEditorContextValue,
} from './JSONEditorContext';
import { setAtPath, type JsonPath } from './JSONEditorHelpers';
import JSONEditorTreeView from './JSONEditorTreeView.vue';
import JSONEditorTextView from './JSONEditorTextView.vue';

/**
 * JSON editor with tree-view and raw-text modes. Tree mode supports inline
 * edit of primitive leaves + per-node copy-path. Text mode parses on commit;
 * invalid JSON shows inline error.
 */
/* `inheritAttrs: false` so `class` folds into the surface's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'JSONEditor', inheritAttrs: false });

const props = withDefaults(defineProps<JSONEditorProps>(), {
  indent: 2,
  minHeight: '14rem',
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`, and Vue casts an
     absent `boolean` prop to `false` — which would shadow the form control context. */
  value: undefined,
  modelValue: undefined,
  defaultValue: undefined,
  mode: undefined,
  defaultMode: undefined,
  isDisabled: undefined,
  isReadOnly: undefined,
  isInvalid: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: unknown];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: unknown];
  /** The `v-model:mode` half. */
  'update:mode': [mode: JSONEditorMode];
  /** Replaces React's `onModeChange`. */
  'mode-change': [mode: JSONEditorMode];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const valueCtl = useControlled<unknown>({
  controlled: () => props.value ?? props.modelValue,
  default: () => props.defaultValue ?? {},
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const modeCtl = useControlled<JSONEditorMode>({
  controlled: () => props.mode,
  default: () => props.defaultMode ?? JSONEditorModeValue.Tree,
  onChange: (next) => {
    emit('update:mode', next);
    emit('mode-change', next);
  },
});

/* Named `document` / `renderMode`, not `value` / `mode`: a setup const sharing a prop's
   name collides with it in the template scope (`vue/no-dupe-keys`). */
const document = valueCtl.value;
const renderMode = modeCtl.value;

/* Inherits flags from a surrounding <Field>; explicit props win. The context id /
   labelling / describedby land on the active editing surface (text-mode textarea or
   tree-mode tree) — the subviews read the context themselves. */
const ctx = useFormControl();
const finalDisabled = computed(() => props.isDisabled ?? ctx?.isDisabled ?? false);
const finalReadOnly = computed(() => props.isReadOnly ?? ctx?.isReadOnly ?? false);
const finalInvalid = computed(() => props.isInvalid ?? ctx?.isInvalid ?? false);

function updateAt(path: JsonPath, next: unknown): void {
  valueCtl.setValue(setAtPath(document.value, path, next));
}

/* Live getters, not a snapshot — a flag change on the root has to reach every tree node. */
provide<JSONEditorContextValue>(JSONEditorKey, {
  updateAt,
  get isDisabled() {
    return finalDisabled.value;
  },
  get isReadOnly() {
    return finalReadOnly.value;
  },
  get isInvalid() {
    return finalInvalid.value;
  },
});

/* `Object.values` hoisted out of the template — the runtime template compiler resolves plain
   identifiers, not arbitrary global calls. */
const modes = Object.values(JSONEditorModeValue);

function modeButtonClass(m: JSONEditorMode): string {
  return cn(
    'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
    renderMode.value === m
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  );
}

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const surfaceClass = computed(() =>
  cn(
    'flex flex-col overflow-hidden rounded-md border border-input bg-card text-card-foreground shadow-sm',
    finalInvalid.value && 'border-destructive',
    finalDisabled.value && 'opacity-60',
    attrs.class as ClassValue,
  ),
);

/** The rendered root `<div>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    :data-state="finalInvalid ? 'invalid' : 'default'"
    :class="surfaceClass"
    :style="{ minHeight }"
    v-bind="passthroughAttrs"
  >
    <div class="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1">
      <div
        role="radiogroup"
        aria-label="JSON mode"
        class="flex items-center gap-0.5 rounded-md bg-card p-0.5 ring-1 ring-border"
      >
        <button
          v-for="m in modes"
          :key="m"
          type="button"
          role="radio"
          :aria-checked="renderMode === m"
          :class="modeButtonClass(m)"
          @click="modeCtl.setValue(m)"
        >
          {{ m }}
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-auto" :style="{ minHeight: 0 }">
      <JSONEditorTreeView v-if="renderMode === 'tree'" :value="document" />
      <JSONEditorTextView v-else :value="document" :indent="indent" @commit="valueCtl.setValue" />
    </div>
  </div>
</template>
