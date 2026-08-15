<script lang="ts">
export interface EditableProps {
  /** The committed value, controlled — React's spelling, which wins when both are set. */
  value?: string;

  /** The committed value, controlled. The `v-model` binding target. */
  modelValue?: string;

  /** The initial committed value when uncontrolled. */
  defaultValue?: string;

  /** The edit-mode state, controlled — the house boolean spelling, which wins when both are set. */
  isEditing?: boolean;

  /** The edit-mode state, controlled. The `v-model:editing` binding target. */
  editing?: boolean;

  /** The initial edit-mode state when uncontrolled. Default `false`. */
  defaultEditing?: boolean;

  /** The preview text shown when the value is empty. */
  placeholder?: string;

  /** Whether blurring the input commits the draft. Default `true`. */
  canSubmitOnBlur?: boolean;

  /** Whether Enter commits the draft. Default `true`. */
  canSubmitOnEnter?: boolean;

  /** Whether Escape discards the draft. Default `true`. */
  canCancelOnEscape?: boolean;

  /** The disabled state. Default `false`. */
  isDisabled?: boolean;

  /** The read-only state. Default `false`. */
  isReadOnly?: boolean;

  /** The hidden input name; the hidden input emits the committed value. */
  name?: string;
}
</script>

<script setup lang="ts">
import { computed, provide, ref, shallowRef, useAttrs, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { EditableKey, type EditableContextValue } from './EditableContext';

/**
 * Editable root. Owns the committed value, the draft and edit mode, and publishes them to
 * `EditablePreview` / `EditableInput` / `EditableSubmit` / `EditableCancel` through injection —
 * React attached those as `Editable.Preview` / `.Input` / … statics, which an SFC's default
 * export cannot carry.
 */
/* `inheritAttrs: false` so `class` folds into the root's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Editable', inheritAttrs: false });

/** The Editable tree — preview, input and the submit/cancel buttons. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<EditableProps>(), {
  defaultEditing: false,
  placeholder: 'Click to edit',
  canSubmitOnBlur: true,
  canSubmitOnEnter: true,
  canCancelOnEscape: true,
  isDisabled: false,
  isReadOnly: false,
  /* Explicit `undefined` defaults are load-bearing: `useControlled` keys on `=== undefined`,
     and Vue casts an absent `boolean` prop to `false` — without these, `isEditing`/`editing`
     would read as "controlled, and closed", pinning the control out of edit mode and making
     `defaultEditing` dead. */
  value: undefined,
  modelValue: undefined,
  isEditing: undefined,
  editing: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: string];
  /** The `v-model:editing` half. */
  'update:editing': [editing: boolean];
  /** Replaces React's `onEditingChange`. */
  'editing-change': [editing: boolean];
}>();

const attrs = useAttrs();

const valueCtl = useControlled<string>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const editingCtl = useControlled<boolean>({
  controlled: () => (props.isEditing !== undefined ? props.isEditing : props.editing),
  default: () => props.defaultEditing,
  onChange: (next) => {
    emit('update:editing', next);
    emit('editing-change', next);
  },
});

/* Named `committed` / `editMode`, not `value` / `editing`: a setup const sharing a prop's
   name collides with it in the template scope (`vue/no-dupe-keys`). */
const committed = valueCtl.value;
const editMode = editingCtl.value;

const draft = ref(committed.value);
const inputEl = shallowRef<HTMLInputElement | null>(null);

/* Syncs the draft when entering edit mode or when the committed value changes externally.
   Not `immediate` — `draft` is already seeded from `value` above, and nothing here touches
   the DOM, so there is no first-run work to do. */
watch([editMode, committed], ([isEditing, next]) => {
  if (isEditing) draft.value = next;
});

function submit(): void {
  valueCtl.setValue(draft.value);
  editingCtl.setValue(false);
}

function cancel(): void {
  draft.value = committed.value;
  editingCtl.setValue(false);
}

/* Live getters, not a snapshot — every flag on the root has to reach already-mounted parts. */
provide<EditableContextValue>(EditableKey, {
  get value() {
    return committed.value;
  },
  get draft() {
    return draft.value;
  },
  setDraft: (next) => {
    draft.value = next;
  },
  get isEditing() {
    return editMode.value;
  },
  setEditing: editingCtl.setValue,
  submit,
  cancel,
  get placeholder() {
    return props.placeholder;
  },
  get isDisabled() {
    return props.isDisabled;
  },
  get isReadOnly() {
    return props.isReadOnly;
  },
  get canSubmitOnBlur() {
    return props.canSubmitOnBlur;
  },
  get canSubmitOnEnter() {
    return props.canSubmitOnEnter;
  },
  get canCancelOnEscape() {
    return props.canCancelOnEscape;
  },
  inputEl,
});

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn('inline-flex items-center gap-1.5', attrs.class as ClassValue));
</script>

<template>
  <div :class="rootClass" v-bind="passthroughAttrs">
    <slot />
    <input v-if="name" type="hidden" :name="name" :value="committed" />
  </div>
</template>
