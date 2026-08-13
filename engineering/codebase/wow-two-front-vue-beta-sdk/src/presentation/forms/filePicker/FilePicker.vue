<script lang="ts">
import type { Size } from '../../../foundation/utils';

export interface FilePickerProps {
  /** The button label. Default `"Choose file"`. Fill the `label` slot for richer content. */
  label?: string | number;

  /** The filename(s) preview rendered next to the button. Fill the `preview` slot for richer content. */
  preview?: string | number;

  /** The visual size of the button. Default `md`. */
  size?: Size;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;
}

/* Sizes not listed fall back to the `md` row at the call site. */
const SIZE: Partial<Record<Size, string>> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { Upload } from 'lucide-vue-next';
import { cn, Size as SizeValue } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { useFormControl } from '../../../foundation/primitives';

/**
 * Basic file picker — styled trigger button + visually-hidden native
 * `<input type="file">`. For drag-drop / preview / progress, use the L5
 * `Dropzone` organism (planned).
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'FilePicker', inheritAttrs: false });

const props = withDefaults(defineProps<FilePickerProps>(), {
  label: 'Choose file',
  size: SizeValue.Md,
  /* Explicit `undefined` default: the flag falls back to the form control context, and Vue
     casts an absent `boolean` prop to `false` — which would shadow it. */
  disabled: undefined,
});

const emit = defineEmits<{
  /** Emits the chosen FileList when files are picked. Replaces React's `onFilesChange`. */
  'files-change': [files: FileList | null];
}>();

defineSlots<{
  label?(): unknown;
  preview?(): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();

/* FormControlContext adoption — the HIDDEN native input carries the context id, so
   `Field`-rendered labels/describedby reference it (label click opens the picker).
   The trigger button mirrors describedby for keyboard users. */
const ctx = useFormControl();

const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const inputId = computed(() => props.id ?? ctx?.id);
const describedBy = computed(() => ctx?.describedBy);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
/* aria- (not native) required — the change handler resets `value` after handing the files
   out, so a native `required` would block every submit. */
const isRequired = computed(() => ctx?.isRequired || undefined);

const hasPreview = computed(() => Boolean(props.preview) || Boolean(slots.preview));

const input = useTemplateRef<HTMLInputElement>('input');

function openPicker(): void {
  input.value?.click();
}

function onChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('files-change', target.files);
  // Reset so re-picking the same file fires change again.
  target.value = '';
}

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const wrapperClass = computed(() =>
  cn('inline-flex items-center gap-3', attrs.class as ClassValue),
);

const buttonClass = computed(() =>
  cn(
    'inline-flex items-center gap-2 rounded-md border border-input bg-background font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    SIZE[props.size] ?? SIZE.md,
  ),
);

const UploadIcon = Upload;

/** The rendered `<input type="file">` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: input });
</script>

<template>
  <div :class="wrapperClass">
    <button
      type="button"
      :disabled="isDisabled"
      :aria-describedby="describedBy"
      :class="buttonClass"
      @click="openPicker"
    >
      <Icon :icon="UploadIcon" :size="16" />
      <slot name="label">{{ label }}</slot>
    </button>
    <input
      ref="input"
      type="file"
      :id="inputId"
      :disabled="isDisabled"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      :aria-required="isRequired"
      class="sr-only"
      v-bind="passthroughAttrs"
      @change="onChange"
    />
    <span v-if="hasPreview" class="truncate text-sm text-muted-foreground">
      <slot name="preview">{{ preview }}</slot>
    </span>
  </div>
</template>
