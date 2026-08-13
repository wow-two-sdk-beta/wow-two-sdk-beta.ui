<script lang="ts">
export interface ThreadViewProps {
  /** The title for the thread panel header. Default `"Thread"`. Rich content → the `title` slot. */
  title?: string | number;

  /** The subtitle shown under the title (e.g. "in #engineering"). Rich content → the `subtitle` slot. */
  subtitle?: string | number;

  /**
   * The reply count label. Left unset it falls back to a count derived from the
   * reply slot; pass `null` to hide the separator row entirely. Rich content →
   * the `replyCount` slot.
   */
  replyCount?: string | number | null;

  /** The close button's visibility. Default true. */
  hasCloseButton?: boolean;
}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, useAttrs, useSlots, useTemplateRef } from 'vue';
import { X as CloseIcon } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { renderableChildren } from '../../../foundation/primitives';

/**
 * Side-panel layout for a single thread: parent message + reply count
 * separator + reply list + composer. The actual messages stay in the slots —
 * `ThreadView` only owns the chrome.
 *
 * React's `parent` / `composer` were structural `ReactNode` props with no string
 * form worth keeping; they are slots only. `title` / `subtitle` / `replyCount`
 * keep their prop form and gain same-named slots.
 */
defineOptions({ name: 'ThreadView', inheritAttrs: false });

defineSlots<{
  /** The title override, when a plain string is not enough. */
  title(): unknown;

  /** The subtitle override, when a plain string is not enough. */
  subtitle(): unknown;

  /** The parent message — typically a `ChatBubble`. Required in React, required here. */
  parent(): unknown;

  /** The reply-count label override, when a plain string is not enough. */
  replyCount(): unknown;

  /** The reply nodes (typically `ChatBubble` items) — React's `children`. */
  default(): unknown;

  /** The composer rendered at the bottom of the panel. */
  composer(): unknown;
}>();

const props = withDefaults(defineProps<ThreadViewProps>(), {
  title: 'Thread',
  subtitle: undefined,
  replyCount: undefined,
  hasCloseButton: true,
});

/** Replaces React's `onClose`; omitting `@close` omits the close button. */
const emit = defineEmits<{
  /** Fires when the close button is activated. */
  close: [];
}>();

const attrs = useAttrs();
const slots = useSlots();
const instance = getCurrentInstance();
const el = useTemplateRef<HTMLDivElement>('el');

/**
 * Mirrors React's `hasCloseButton && onClose && <button/>` guard — the button
 * renders only when the consumer bound `@close`. Read through a call, not a
 * cached computed: `instance.vnode` is replaced on every re-render.
 */
const hasClose = () => props.hasCloseButton && Boolean(instance?.vnode.props?.onClose);

/**
 * Replaces React's `Array.isArray(children) ? children : [children]` count.
 * Called per render rather than cached — a slot's content is only knowable at
 * render time, and `renderableChildren` drops the comment/whitespace vnodes
 * that would otherwise read as replies.
 */
const defaultReplyCount = (): string => {
  const count = renderableChildren(slots.default?.()).length;
  if (count === 0) return 'No replies yet';
  return count === 1 ? '1 reply' : `${count} replies`;
};

const hasSubtitle = computed(() => props.subtitle != null || Boolean(slots.subtitle));

const classes = computed(() =>
  cn(
    'flex h-full min-h-0 flex-col rounded-md border border-border bg-card',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" role="complementary" aria-label="Thread" v-bind="rest" :class="classes">
    <header
      class="flex items-start justify-between gap-2 border-b border-border px-4 py-3"
    >
      <div class="min-w-0">
        <div class="text-sm font-semibold text-foreground">
          <slot name="title">{{ props.title }}</slot>
        </div>
        <div v-if="hasSubtitle" class="text-xs text-muted-foreground">
          <slot name="subtitle">{{ props.subtitle }}</slot>
        </div>
      </div>
      <button
        v-if="hasClose()"
        type="button"
        aria-label="Close thread"
        class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="emit('close')"
      >
        <CloseIcon class="h-4 w-4" />
      </button>
    </header>
    <div class="flex-1 min-h-0 overflow-y-auto px-4 py-3">
      <div><slot name="parent" /></div>
      <div v-if="props.replyCount !== null" class="my-3 flex items-center gap-3">
        <span class="text-xs text-muted-foreground">
          <slot name="replyCount">{{ props.replyCount ?? defaultReplyCount() }}</slot>
        </span>
        <span aria-hidden="true" class="h-px flex-1 bg-border" />
      </div>
      <div class="flex flex-col gap-2"><slot /></div>
    </div>
    <div v-if="$slots.composer" class="border-t border-border px-3 py-2">
      <slot name="composer" />
    </div>
  </div>
</template>
