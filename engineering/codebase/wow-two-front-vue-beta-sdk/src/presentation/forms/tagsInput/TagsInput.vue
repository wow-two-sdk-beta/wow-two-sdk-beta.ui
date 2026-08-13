<script lang="ts">
import type { TagVariant } from '../../display/tag';
import type { InputSize, InputState } from '../InputStyles';

export interface TagsInputProps {
  /** The control size. */
  size?: InputSize;

  /** The validity surface. */
  state?: InputState;

  /** The committed tags, controlled — React's spelling, which wins when both are set. */
  value?: ReadonlyArray<string>;

  /** The committed tags, controlled. The `v-model` binding target. */
  modelValue?: ReadonlyArray<string>;

  /** The initial tags when uncontrolled. */
  defaultValue?: ReadonlyArray<string>;

  /** The in-flight text, controlled. The `v-model:input-value` binding target. */
  inputValue?: string;

  /** The empty-state placeholder. */
  placeholder?: string;

  /** The characters that commit the current input. Enter and Tab always do. */
  delimiters?: ReadonlyArray<string>;

  /**
   * The predicate gating committed tags. Default: non-empty after trim.
   *
   * Kept a PROP, not an emit: it RETURNS a verdict, which an emit cannot do.
   */
  validate?: (tag: string) => boolean;

  /** Whether the same tag may be committed twice. */
  allowsDuplicates?: boolean;

  /** The cap on committed tags. */
  max?: number;

  /** The invalid surface override. Falls back to the surrounding form control's `isInvalid`. */
  isInvalid?: boolean;

  /** The hidden input name; the hidden input emits the comma-joined value. */
  name?: string;

  /**
   * The chip variant.
   *
   * The NAMED type, not `TagVariants['variant']` as React spelled it — the SFC prop
   * resolver cannot follow an indexed access into an imported interface, and the build
   * fails on it while `vue-tsc` stays green.
   */
  tagVariant?: TagVariant;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The read-only state — React's spelling. Falls back to the form control's `isReadOnly`. */
  readOnly?: boolean;

  /** The DOM spelling of {@link TagsInputProps.readOnly}, which wins when both are set. */
  readonly?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import Tag from '../../display/tag/Tag.vue';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';

/**
 * Free-form tag entry. Type → Enter/comma/Tab commits. Backspace at empty
 * input removes the last tag. Renders chips via `display/Tag`.
 */
/* `inheritAttrs: false` so `class` folds into the container's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'TagsInput', inheritAttrs: false });

const props = withDefaults(defineProps<TagsInputProps>(), {
  placeholder: 'Add tag…',
  delimiters: () => [','],
  validate: (t: string) => t.trim().length > 0,
  allowsDuplicates: false,
  tagVariant: 'neutral',
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form control
     context, and Vue casts an absent `boolean` prop to `false` — which would shadow it. */
  isInvalid: undefined,
  disabled: undefined,
  readOnly: undefined,
  readonly: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [tags: ReadonlyArray<string>];
  /** Replaces React's `onValueChange`. */
  'value-change': [tags: ReadonlyArray<string>];
  /** The `v-model:input-value` half. */
  'update:inputValue': [input: string];
  /** Replaces React's `onInputChange`. */
  'input-change': [input: string];
}>();

const attrs = useAttrs();

const tagsControlled = useControlled<ReadonlyArray<string>>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? [],
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const textControlled = useControlled<string>({
  controlled: () => props.inputValue,
  default: () => '',
  onChange: (next) => {
    emit('update:inputValue', next);
    emit('input-change', next);
  },
});

const tags = tagsControlled.value;
const text = textControlled.value;

const input = useTemplateRef<HTMLInputElement>('input');
const pendingDelete = ref(false);

/* FormControlContext adoption — explicit props stay as overrides. */
const ctx = useFormControl();
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isReadOnly = computed(() => props.readonly ?? props.readOnly ?? ctx?.isReadOnly);
const invalid = computed(() => props.isInvalid ?? ctx?.isInvalid);
const finalState = computed(
  () =>
    props.state ?? (invalid.value ? InputStateValue.Invalid : InputStateValue.Default),
);

function commit(raw: string): void {
  const trimmed = raw.trim();
  if (!trimmed || !props.validate(trimmed)) return;
  if (!props.allowsDuplicates && tags.value.includes(trimmed)) return;
  if (props.max != null && tags.value.length >= props.max) return;
  tagsControlled.setValue([...tags.value, trimmed]);
  textControlled.setValue('');
}

function removeAt(index: number): void {
  tagsControlled.setValue(tags.value.filter((_, i) => i !== index));
}

function onInput(event: Event): void {
  textControlled.setValue((event.target as HTMLInputElement).value);
}

/* Runs after any caller-supplied `@keydown` (declared after `v-bind`), exactly as React's
   `onKeyDown?.(e)` ran before this body. */
function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || isDisabled.value || isReadOnly.value) return;
  if (event.key === 'Enter' || (event.key === 'Tab' && text.value)) {
    if (text.value) {
      event.preventDefault();
      commit(text.value);
      pendingDelete.value = false;
    }
    return;
  }
  if (props.delimiters.includes(event.key)) {
    event.preventDefault();
    commit(text.value);
    pendingDelete.value = false;
    return;
  }
  if (event.key === 'Backspace' && !text.value && tags.value.length > 0) {
    if (pendingDelete.value) {
      event.preventDefault();
      removeAt(tags.value.length - 1);
      pendingDelete.value = false;
    } else {
      pendingDelete.value = true;
    }
    return;
  }
  pendingDelete.value = false;
}

/* React did not gate blur on `defaultPrevented`; neither does this. */
function onBlur(): void {
  if (text.value) commit(text.value);
  pendingDelete.value = false;
}

function onContainerClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) input.value?.focus();
}

function isPendingDelete(index: number): boolean {
  return pendingDelete.value && index === tags.value.length - 1;
}

/**
 * The Vue `Tag` renders its close button only when the consumer bound `@close` — the same
 * `onClose && <button/>` guard React had. A listener cannot be conditionally omitted with
 * `@close`, so it is bound through `v-on` with an object that is empty when closing is off.
 */
function tagListeners(index: number): Record<string, () => void> {
  if (isDisabled.value || isReadOnly.value) return {};
  return { close: () => removeAt(index) };
}

function tagClass(index: number): string {
  return cn(isPendingDelete(index) && 'ring-1 ring-ring');
}

/* Never declared props — a declared `'aria-describedby'` would arrive as
   `props.ariaDescribedby` and stop reaching the DOM. Both are read off the attrs so the
   consumer's value can override the context's. */
const ariaDescribedBy = computed(() => attrs['aria-describedby'] as string | undefined);
const ariaRequired = computed(() => attrs['aria-required'] as 'true' | 'false' | boolean | undefined);

const inputId = computed(() => props.id ?? ctx?.id);
const describedBy = computed(() => ariaDescribedBy.value ?? ctx?.describedBy);
/* aria- (not native) required — the tag list is the value; a native `required` on the empty
   inner input would block submits even with tags committed. */
const requiredAttr = computed(() => ariaRequired.value ?? (ctx?.isRequired || undefined));
const inputPlaceholder = computed(() =>
  tags.value.length === 0 ? props.placeholder : undefined,
);
const hiddenValue = computed(() => tags.value.join(','));

const OWNED_ATTRS: ReadonlySet<string> = new Set([
  'class',
  'aria-describedby',
  'aria-required',
]);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    inputBaseVariants({ size: props.size, state: finalState.value }),
    'h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5',
    isDisabled.value && 'cursor-not-allowed opacity-60',
    attrs.class as ClassValue,
  ),
);

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: input });
</script>

<template>
  <div
    role="group"
    :data-disabled="isDisabled || undefined"
    :data-readonly="isReadOnly || undefined"
    :data-invalid="invalid || undefined"
    :class="rootClass"
    @click="onContainerClick"
  >
    <Tag
      v-for="(t, i) in tags"
      :key="`${t}-${i}`"
      :variant="tagVariant"
      :data-pending-delete="isPendingDelete(i) ? '' : undefined"
      :class="tagClass(i)"
      v-on="tagListeners(i)"
    >
      {{ t }}
    </Tag>
    <input
      ref="input"
      type="text"
      :id="inputId"
      :value="text"
      :placeholder="inputPlaceholder"
      :disabled="isDisabled"
      :readonly="isReadOnly"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedBy"
      :aria-required="requiredAttr"
      class="min-w-[6rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed"
      v-bind="passthroughAttrs"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    />
    <input v-if="name" type="hidden" :name="name" :value="hiddenValue" />
  </div>
</template>
