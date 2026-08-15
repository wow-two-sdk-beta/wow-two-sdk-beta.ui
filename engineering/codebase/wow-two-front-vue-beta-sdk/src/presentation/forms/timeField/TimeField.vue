<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { InputSize, InputState, InputBorder, InputRing } from '../InputStyles';

export interface TimeFieldProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;

  /** The value, controlled. The `v-model` binding target. `null` is the cleared state. */
  modelValue?: Temporal.PlainTime | null;

  /** The value, controlled — React's spelling of `modelValue`, which wins when both are set. */
  value?: Temporal.PlainTime | null;

  /** The initial value when uncontrolled. */
  defaultValue?: Temporal.PlainTime | null;

  /**
   * Renders a bare `<input type="time">` and drops the popover.
   *
   * Opt-in only. The browser owns that control's picker panel — it cannot be themed, so it
   * lands a system-chrome popup in the middle of a design-system form. Reach for it when the
   * platform picker is the point (a mobile-first form wanting the OS wheel, for instance).
   */
  native?: boolean;

  /** The minute interval offered in the popover. Default 5. Ignored when `native`. */
  minuteStep?: number;

  /** The empty-state text. Ignored when `native` — that control renders its own mask. */
  placeholder?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}

/** Accepts `9`, `09`, `930`, `9:30`, `09:30` — hour alone, or hour + 2-digit minute. */
const TIME_TEXT = /^(\d{1,2})(?::?(\d{2}))?$/;
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { Temporal as TemporalValue } from 'temporal-polyfill';
import { Clock } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';
import { formatISOTime } from '../DateExtensions';
import TimeColumns from '../TimeColumns.vue';

/**
 * Atomic time input — a typed `HH:MM` field with a design-system popover on the trailing
 * clock button. Accepts and emits `Temporal.PlainTime`.
 *
 * The popover is ours (`TimeColumns` inside `overlays/popover`), not the browser's: an
 * `<input type="time">` opens an unstylable system panel, which is what `native` is for.
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'TimeField', inheritAttrs: false });

const props = withDefaults(defineProps<TimeFieldProps>(), {
  native: false,
  minuteStep: 5,
  placeholder: '--:--',
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form
     control context, and Vue casts an absent `boolean` prop to `false` — which would
     shadow the context with a hard "not disabled / not required". */
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: Temporal.PlainTime | null];
  /** Replaces React's `onValueChange`. Native `input` / `change` stay fallthrough listeners. */
  'value-change': [value: Temporal.PlainTime | null];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<Temporal.PlainTime | null>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const committed = controlled.value;

const open = ref(false);

/** The in-flight text — free-form while typing, reconciled with `committed` on commit. */
const draft = ref<string>(formatISOTime(committed.value));

/* Syncs the draft when the committed value changes from the outside (or from the popover). */
watch(committed, (next) => {
  draft.value = formatISOTime(next);
});

function parseTimeText(text: string): Temporal.PlainTime | null {
  const match = TIME_TEXT.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = match[2] === undefined ? 0 : Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return new TemporalValue.PlainTime(hour, minute);
}

/** Commits the draft; an unparseable draft reverts to the committed value (ColorField parity). */
function commit(): void {
  if (!draft.value.trim()) {
    controlled.setValue(null);
    draft.value = '';
    return;
  }
  const next = parseTimeText(draft.value);
  if (next) {
    controlled.setValue(next);
    draft.value = formatISOTime(next);
  } else {
    draft.value = formatISOTime(committed.value);
  }
}

function onDraftInput(event: Event): void {
  draft.value = (event.target as HTMLInputElement).value;
}

/* Runs after any caller-supplied `@blur` — declared after `v-bind`, so Vue chains theirs first. */
function onBlur(): void {
  commit();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
  }
}

/** The `native` path keeps the original `HH:MM`-string round trip. */
function onNativeInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  controlled.setValue(raw ? parseTimeText(raw) : null);
}

function onColumnsChange(next: Temporal.PlainTime): void {
  controlled.setValue(next);
}

const displayValue = computed(() => formatISOTime(committed.value));

const finalState = computed(() => props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default));

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

/* The caller's `class` sizes the field and the input keeps `w-full` from the variants —
   the adorned-input idiom already used by `PasswordInput` / `SearchInput`. */
const wrapperClass = computed(() => cn('relative', attrs.class as ClassValue));

const inputClass = computed(() =>
  cn(
    inputBaseVariants({
      size: props.size,
      state: finalState.value,
      border: props.border,
      ring: props.ring,
    }),
    !props.native && 'pr-10',
  ),
);

const root = useTemplateRef<HTMLInputElement>('root');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div :class="wrapperClass">
    <!-- The unstylable-system-panel path, kept for callers that want the platform picker. -->
    <input
      v-if="native"
      ref="root"
      type="time"
      :id="inputId"
      :value="displayValue"
      :disabled="isDisabled"
      :required="isRequired"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      :class="inputClass"
      v-bind="passthroughAttrs"
      @input="onNativeInput"
    />

    <Popover v-else v-model:open="open" placement="bottom-start" :offset="6">
      <input
        ref="root"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :spellcheck="false"
        :id="inputId"
        :value="draft"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :required="isRequired"
        :aria-invalid="isInvalid"
        :aria-describedby="describedBy"
        :class="inputClass"
        v-bind="passthroughAttrs"
        @input="onDraftInput"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <PopoverTrigger
        aria-label="Choose time"
        :disabled="isDisabled"
        class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <Clock class="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent is-bare>
        <TimeColumns :value="committed" :minute-step="minuteStep" :on-time-change="onColumnsChange" />
      </PopoverContent>
    </Popover>
  </div>
</template>
