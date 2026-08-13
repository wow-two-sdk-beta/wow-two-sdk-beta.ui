import { inject, type InjectionKey } from 'vue';
import type { JsonPath } from './JSONEditorHelpers';

/** Defines how a JSON editor renders its document. */
export const JSONEditorMode = {
  /** Refers to the collapsible tree/structured view. */
  Tree: 'tree',
  /** Refers to the raw-text view. */
  Text: 'text',
} as const;

export type JSONEditorMode = (typeof JSONEditorMode)[keyof typeof JSONEditorMode];

/**
 * The seam between `JSONEditor` and its private tree/text subviews.
 *
 * React drilled `updateAt` + the three flags through every `TreeNode` recursion level.
 * Injection carries them instead — the tree is arbitrarily deep, and re-emitting an
 * `update-at` event at each level would be the only alternative under the emits rule.
 * Every field but `updateAt` is a live getter — read them off the object, don't destructure.
 */
export interface JSONEditorContextValue {
  /** Writes `next` at `path` and publishes the new document. */
  updateAt: (path: JsonPath, next: unknown) => void;
  readonly isDisabled: boolean;
  readonly isReadOnly: boolean;
  readonly isInvalid: boolean;
}

export const JSONEditorKey: InjectionKey<JSONEditorContextValue> = Symbol('wow-two.jsonEditor');

/** Reads the surrounding JSON-editor context; throws when used outside a `<JSONEditor>`. */
export function useJSONEditorContext(): JSONEditorContextValue {
  const context = inject(JSONEditorKey, null);
  if (!context) throw new Error('JSONEditor.* must be used inside <JSONEditor>');
  return context;
}
