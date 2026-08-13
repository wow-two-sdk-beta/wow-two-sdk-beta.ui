<script lang="ts">
import { Marked } from 'marked';
import { Bold, Code, Heading1, Heading2, Italic, Link2, List, Quote } from 'lucide-vue-next';
import type { IconAdapter } from '../../../foundation/icons';

/** Defines the pane layout of a markdown editor. */
export const MarkdownEditorView = {
  /** Refers to editor + preview shown side by side. */
  Split: 'split',
  /** Refers to the editor pane only. */
  Edit: 'edit',
  /** Refers to the rendered-preview pane only. */
  Preview: 'preview',
} as const;

export type MarkdownEditorView = (typeof MarkdownEditorView)[keyof typeof MarkdownEditorView];

export interface MarkdownEditorProps {
  /** The markdown source, controlled — React's spelling, which wins when both are set. */
  value?: string;

  /** The markdown source, controlled. The `v-model` binding target. */
  modelValue?: string;

  /** The initial markdown source when uncontrolled. */
  defaultValue?: string;

  /** The pane layout, controlled. The `v-model:view` binding target. */
  view?: MarkdownEditorView;

  /** The initial pane layout when uncontrolled. Default `split`. */
  defaultView?: MarkdownEditorView;

  /** The invalid surface override. Falls back to the surrounding form control's `isInvalid`. */
  isInvalid?: boolean;

  /** The CSS minHeight on the surface (default `18rem`). */
  minHeight?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The read-only state — React's spelling. Falls back to the form control's `isReadOnly`. */
  readOnly?: boolean;

  /** The DOM spelling of {@link MarkdownEditorProps.readOnly}, which wins when both are set. */
  readonly?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}

/** Describes the selection a toolbar action operates on. */
interface ToolbarSelection {
  value: string;
  start: number;
  end: number;
}

/** Describes the edit a toolbar action produces. */
interface ToolbarEdit {
  value: string;
  selStart: number;
  selEnd: number;
}

interface ToolbarAction {
  key: string;
  label: string;
  /* React held a rendered `ReactNode` here; an SFC's plain script block cannot carry JSX, so
     the icon COMPONENT is stored and `<Icon>` renders it in the template. */
  icon: IconAdapter;
  apply: (sel: ToolbarSelection) => ToolbarEdit;
}

const wrap =
  (before: string, after: string) =>
  ({ value, start, end }: ToolbarSelection): ToolbarEdit => {
    const sel = value.slice(start, end);
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    const selStart = start + before.length;
    return { value: next, selStart, selEnd: selStart + sel.length };
  };

const linePrefix =
  (prefix: string) =>
  ({ value, start, end }: ToolbarSelection): ToolbarEdit => {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const trailing = value.slice(end).indexOf('\n');
    const lineEnd = trailing === -1 ? value.length : end + trailing;
    const block = value.slice(lineStart, lineEnd);
    const updated = block
      .split('\n')
      .map((l) => prefix + l)
      .join('\n');
    const next = value.slice(0, lineStart) + updated + value.slice(lineEnd);
    return { value: next, selStart: lineStart + prefix.length, selEnd: lineStart + updated.length };
  };

const escapeHtml = (html: string) =>
  html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Only protocols a markdown link/image may navigate to from the preview;
// anything else (javascript:, data:, vbscript:, …) is dropped.
const SAFE_URL = /^(?:https?:|mailto:|tel:|[^a-z0-9.+-]|[a-z0-9.+-]*$)/i;

const safeUrl = (href: string) => (SAFE_URL.test(href.trim()) ? href : null);

// Local marked instance whose raw-HTML tokens render as escaped text, so
// embedded HTML (e.g. `<img onerror=…>`) is inert in the default preview,
// and whose link/image URLs are protocol-filtered (no `javascript:` links).
// Markdown formatting is unaffected. Consumers needing real HTML fill the
// `preview` slot and sanitize themselves.
const previewMarked = new Marked({
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const url = safeUrl(href);
      const text = this.parser.parseInline(tokens);
      if (url === null) return text;
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(url)}"${titleAttr}>${text}</a>`;
    },
    image({ href, title, text }) {
      const url = safeUrl(href);
      if (url === null) return escapeHtml(text);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${titleAttr}>`;
    },
  },
});

const ACTIONS: ReadonlyArray<ToolbarAction> = [
  { key: 'h1', label: 'Heading 1', icon: Heading1, apply: linePrefix('# ') },
  { key: 'h2', label: 'Heading 2', icon: Heading2, apply: linePrefix('## ') },
  { key: 'bold', label: 'Bold', icon: Bold, apply: wrap('**', '**') },
  { key: 'italic', label: 'Italic', icon: Italic, apply: wrap('*', '*') },
  { key: 'code', label: 'Inline code', icon: Code, apply: wrap('`', '`') },
  { key: 'link', label: 'Link', icon: Link2, apply: wrap('[', '](https://)') },
  { key: 'list', label: 'List', icon: List, apply: linePrefix('- ') },
  { key: 'quote', label: 'Blockquote', icon: Quote, apply: linePrefix('> ') },
];

/* Hoisted out of the template — the runtime template compiler resolves plain identifiers,
   not array literals built from an imported enum. */
const VIEW_ORDER: ReadonlyArray<MarkdownEditorView> = [
  MarkdownEditorView.Edit,
  MarkdownEditorView.Split,
  MarkdownEditorView.Preview,
];
</script>

<script setup lang="ts">
import { computed, nextTick, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled, useId } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';
import { useFormControl } from '../../../foundation/primitives';
import { InputState } from '../InputStyles';

/**
 * Markdown input + live preview. Toolbar wraps selection with syntax;
 * preview pane renders via `marked` with raw HTML escaped to inert text
 * (XSS-safe by default). Fill the `preview` slot to opt out — the consumer
 * is then responsible for sanitizing. Three view modes: `split` / `edit` /
 * `preview`.
 */
/* `inheritAttrs: false` so `class` folds into the surface's own `cn()` call, and so the rest
   of the attrs land on the inner `<textarea>` rather than the surface. */
defineOptions({ name: 'MarkdownEditor', inheritAttrs: false });

const props = withDefaults(defineProps<MarkdownEditorProps>(), {
  minHeight: '18rem',
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`, and Vue casts an
     absent `boolean` prop to `false` — which would shadow the form control context. */
  value: undefined,
  modelValue: undefined,
  view: undefined,
  defaultView: undefined,
  isInvalid: undefined,
  disabled: undefined,
  readOnly: undefined,
  readonly: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: string];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: string];
  /** The `v-model:view` half. */
  'update:view': [view: MarkdownEditorView];
  /** Replaces React's `onViewChange`. */
  'view-change': [view: MarkdownEditorView];
}>();

defineSlots<{
  /** Replaces the rendered preview pane — React's `renderPreview`. Filling it opts out of
   *  the built-in `marked` render, and the consumer owns sanitizing. */
  preview?(props: { markdown: string }): unknown;
}>();

const attrs = useAttrs();
const slots = useSlots();

const valueCtl = useControlled<string>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const viewCtl = useControlled<MarkdownEditorView>({
  controlled: () => props.view,
  default: () => props.defaultView ?? MarkdownEditorView.Split,
  onChange: (next) => {
    emit('update:view', next);
    emit('view-change', next);
  },
});

/* Named `markdown` / `mode`, not `value` / `view`: a setup const sharing a prop's name
   collides with it in the template scope (`vue/no-dupe-keys`). */
const markdown = valueCtl.value;
const mode = viewCtl.value;

const textarea = useTemplateRef<HTMLTextAreaElement>('textarea');
const generatedId = useId('markdown-editor');

/* Inherits id/flags/describedby from a surrounding <Field>; explicit props win.
   The context wires the EDITING surface (textarea) only — the preview pane is
   read-only chrome, not the control. */
const ctx = useFormControl();
const finalDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const finalReadOnly = computed(() => props.readonly ?? props.readOnly ?? ctx?.isReadOnly);
const finalInvalid = computed(() => props.isInvalid ?? ctx?.isInvalid);

const hasPreviewSlot = computed(() => Boolean(slots.preview));

const previewHtml = computed(() => {
  if (hasPreviewSlot.value) return null;
  try {
    return previewMarked.parse(markdown.value, { async: false }) as string;
  } catch {
    return '<p>Failed to render preview.</p>';
  }
});

function applyAction(action: ToolbarAction): void {
  const ta = textarea.value;
  if (!ta) return;
  const next = action.apply({
    value: markdown.value,
    start: ta.selectionStart ?? markdown.value.length,
    end: ta.selectionEnd ?? markdown.value.length,
  });
  valueCtl.setValue(next.value);
  /* React reached for `requestAnimationFrame` to wait out its re-render; `nextTick` resolves
     after the reactive update has been flushed to the DOM, and keeps a browser global out of
     this file. */
  void nextTick(() => {
    ta.focus();
    ta.selectionStart = next.selStart;
    ta.selectionEnd = next.selEnd;
  });
}

function onInput(event: Event): void {
  valueCtl.setValue((event.target as HTMLTextAreaElement).value);
}

const showEdit = computed(
  () => mode.value === MarkdownEditorView.Split || mode.value === MarkdownEditorView.Edit,
);
const showPreview = computed(
  () => mode.value === MarkdownEditorView.Split || mode.value === MarkdownEditorView.Preview,
);

const state = computed(() => (finalInvalid.value ? InputState.Invalid : InputState.Default));

/* Never a declared prop — a declared `'aria-describedby'` would arrive as
   `props.ariaDescribedby` and stop reaching the DOM. */
const ariaDescribedBy = computed(() => attrs['aria-describedby'] as string | undefined);

const textareaId = computed(() => props.id ?? ctx?.id ?? generatedId);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const describedBy = computed(() => ariaDescribedBy.value ?? ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'aria-describedby']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const surfaceClass = computed(() =>
  cn(
    'flex flex-col overflow-hidden rounded-md border border-input bg-card text-card-foreground shadow-sm',
    state.value === InputState.Invalid && 'border-destructive',
    finalDisabled.value && 'opacity-60',
    attrs.class as ClassValue,
  ),
);

const textareaClass = computed(() =>
  cn(
    'flex-1 resize-none whitespace-pre-wrap break-words bg-transparent p-3 font-mono text-sm outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed',
    showPreview.value && 'border-r-0',
  ),
);

function viewButtonClass(v: MarkdownEditorView): string {
  return cn(
    'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
    mode.value === v
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  );
}

/** The rendered `<textarea>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: textarea });
</script>

<template>
  <div :data-state="state" :class="surfaceClass" :style="{ minHeight }">
    <div class="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1">
      <div role="toolbar" aria-label="Markdown formatting" class="flex items-center gap-0.5">
        <button
          v-for="a in ACTIONS"
          :key="a.key"
          type="button"
          :aria-label="a.label"
          :disabled="finalDisabled || finalReadOnly"
          class="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          @click="applyAction(a)"
        >
          <Icon :icon="a.icon" :size="14" />
        </button>
      </div>
      <div
        role="radiogroup"
        aria-label="View mode"
        class="ml-auto flex items-center gap-0.5 rounded-md bg-card p-0.5 ring-1 ring-border"
      >
        <button
          v-for="v in VIEW_ORDER"
          :key="v"
          type="button"
          role="radio"
          :aria-checked="mode === v"
          :class="viewButtonClass(v)"
          @click="viewCtl.setValue(v)"
        >
          {{ v }}
        </button>
      </div>
    </div>
    <div class="flex flex-1 divide-x divide-border" :style="{ minHeight: 0 }">
      <textarea
        v-if="showEdit"
        ref="textarea"
        :id="textareaId"
        :value="markdown"
        :disabled="finalDisabled"
        :readonly="finalReadOnly"
        :required="isRequired"
        :spellcheck="false"
        :aria-invalid="finalInvalid || undefined"
        :aria-describedby="describedBy"
        :class="textareaClass"
        v-bind="passthroughAttrs"
        @input="onInput"
      />
      <!--
        `group` role: aria-label is prohibited on a bare (generic) div —
        axe aria-prohibited-attr. Non-landmark grouping keeps the pane
        named for AT without polluting the page's region list.
      -->
      <div
        v-if="showPreview"
        role="group"
        aria-live="polite"
        aria-label="Preview"
        class="prose prose-sm flex-1 overflow-auto bg-background p-3 text-sm text-foreground"
      >
        <slot v-if="hasPreviewSlot" name="preview" :markdown="markdown" />
        <!-- eslint-disable-next-line vue/no-v-html -- `previewMarked` escapes raw HTML tokens
             and protocol-filters link/image URLs; the consumer opts out via the `preview` slot. -->
        <div v-else v-html="previewHtml ?? ''" />
      </div>
    </div>
  </div>
</template>
