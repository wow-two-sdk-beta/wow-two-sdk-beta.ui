import {
  computed,
  defineComponent,
  h,
  shallowRef,
  watch,
  type Component,
  type PublicProps,
  type Ref,
  type VNode,
} from 'vue';

import type { AppArrayApi, AppFieldApi, AppFieldProps, AppFormState } from './AppForm';
import { getPath } from './Paths';

/*
 * useFieldArray — the typed row-render helper over `form.array(path)`
 * (docs/analysis/forms-deferred-items.md item 2b · forms-vector-next.md §F-2g).
 *
 * ENGINE-FREE, ONE IMPLEMENTATION. It composes only the shared `AppForm` contract —
 * `form.array` (ops), `form.useFormState` (a reactive row count), `form.Field` (the per-cell
 * binding) — so it serves BOTH adapters (`house` + `tanstack`) with no per-engine code and no
 * conformance drift; the shared suite pins it once against each.
 *
 * WHY IT EXISTS. A deep path like `rules[0].destination` resolves to `unknown` on
 * `AppFieldValue` — the deliberate typed-values / untyped-paths contract line (recursive
 * `PathValue` is rejected: it re-implements vendor `DeepKeys`, blows up on our discriminated
 * unions, and leaks engine types into the engine-free contract — item 2, option a). So every
 * array-row cell casts `f.value` (smart-qr `RuleControls`: 3 casts/row). This helper is typed
 * by the ROW ELEMENT instead: one generic `TItem` + one `keyof TItem`, NO recursion, NO vendor
 * deep-path types. A cell binds with `f.value` typed as `TItem[name]`, and the single
 * `unknown → element` cast lives HERE, in the SDK, once — not per-row in every consumer.
 *
 * It also retires the F-2g strain "a reorderable-array component must become form-aware": the
 * component takes `form` + `path` once through this composable, gets stable row keys (focus +
 * local state follow the logical row through insert/remove/swap/move, not the index), and drives
 * row-scoped errors through `form.array`'s existing reindexing — never reimplemented here.
 *
 * REACT'S `useRef` + `useReducer(forceRender)` PAIR IS GONE. The key list is a `shallowRef` an
 * op REPLACES (never mutates in place), so a reorder that keeps the length — swap / move — still
 * publishes; that is the whole job `forceRender` was doing. Reconciling an externally-changed
 * length (`reset(data)`, a whole-array `setValue`) moved out of the render, where React had to
 * put it, into a sync-flush `watch` on the length: it lands in the same tick as the store commit,
 * so no read ever sees a stale key list, and nothing writes reactive state from inside a
 * `computed`.
 */

/** The slice of the `AppForm` contract the helper consumes — every engine's `AppForm` satisfies it. */
export interface FieldArrayForm {
  /** Field wrapper — rendered per cell at the row's element path (`${path}[${index}].${name}`). */
  readonly Field: FieldArrayGlueField;
  /** Array ops at a path — the helper's ops delegate here (never reimplemented). */
  readonly array: (path: string) => AppArrayApi;
  /** Selector-subscribed form state — the helper subscribes to the array's length only. */
  readonly useFormState: <TSlice>(
    selector: (state: AppFormState<unknown>) => TSlice,
    isEqual?: (a: TSlice, b: TSlice) => boolean,
  ) => Readonly<Ref<TSlice>>;
}

/**
 * The loose (engine-free `AppFieldComponent`) props shape a `form.Field` accepts at a dynamic
 * path — DERIVED from the contract's own props at `TPath = string`, never a second copy of them.
 * A hand-written twin drifts silently and the failure lands on the consumer, as
 * `useFieldArray(form, path)` no longer accepting an `AppForm` at all.
 */
export type FieldArrayGlueFieldProps = AppFieldProps<string>;

/**
 * `form.Field` seen loosely — a dynamic path, an untyped cell payload. The slot signature is
 * deliberately `never`-parametered so that an `AppFieldComponent<TValues>` is assignable here for
 * ANY `TValues`, which is what lets one helper serve both adapters; the row cell's real payload
 * type is restored below, on {@link FieldArrayFieldProps}.
 */
export interface FieldArrayGlueField {
  new (props: FieldArrayGlueFieldProps): {
    $props: FieldArrayGlueFieldProps & PublicProps;
    $slots: { default?: (...args: never[]) => VNode[] };
  };
}

/** One rendered row — a stable `key` for `v-for` (survives reorder) plus its live array index. */
export interface FieldArrayRow {
  readonly key: string;
  readonly index: number;
}

/** Props for the typed row-field accessor — binds `${path}[${index}].${name}`, `f.value` typed as `TItem[name]`. */
export interface FieldArrayFieldProps<TItem extends object, TName extends keyof TItem & string> {
  /** The row's current array index (from `row.index`). */
  readonly index: number;
  /** The element field key — one level deep into `TItem`. */
  readonly name: TName;
  readonly isDisabled?: boolean;
  readonly isRequired?: boolean;
  readonly isReadOnly?: boolean;
}

/** The typed row-field accessor — one level deep (`keyof TItem`), no recursion, no vendor deep-path types. */
export interface FieldArrayField<TItem extends object> {
  new <TName extends keyof TItem & string>(
    props: FieldArrayFieldProps<TItem, TName>,
  ): {
    $props: FieldArrayFieldProps<TItem, TName> & PublicProps;
    /** `field.value` / `field.setValue` are typed as `TItem[name]` — no cast, and `v-model="f.value"` binds. */
    $slots: { default?: (field: AppFieldApi<TItem[TName]>) => VNode[] };
  };
}

/** What `useFieldArray` returns — reactive rows + stable keys, a typed row-field accessor, and element-typed ops. */
export interface FieldArray<TItem extends object> {
  /** The current rows — `{ key, index }`; render with `:key="row.key"` so a cell keeps identity through reorder. */
  readonly rows: readonly FieldArrayRow[];
  /** The current row count. */
  readonly length: number;
  /** The typed row-field accessor — `<array.Field :index="row.index" name="destination">`. */
  readonly Field: FieldArrayField<TItem>;
  /** Appends a row (typed to the element — a mistyped push is a compile error). Delegates to `form.array`. */
  readonly push: (value: TItem) => void;
  /** Inserts a row at `index`. Delegates to `form.array`. */
  readonly insert: (index: number, value: TItem) => void;
  /** Removes the row at `index`. Delegates to `form.array`. */
  readonly remove: (index: number) => void;
  /** Swaps two rows. Delegates to `form.array`. */
  readonly swap: (indexA: number, indexB: number) => void;
  /** Moves a row. Delegates to `form.array`. */
  readonly move: (fromIndex: number, toIndex: number) => void;
}

/** Monotonic per-instance row-key allocator — keys are never reused, so a removed row's key can't collide. */
function makeKey(seq: { current: number }): string {
  const id = seq.current;
  seq.current = id + 1;
  return `far-${id}`;
}

/** Builds `length` fresh keys (first read). */
function buildKeys(length: number, seq: { current: number }): string[] {
  const keys: string[] = [];
  for (let index = 0; index < length; index += 1) keys.push(makeKey(seq));
  return keys;
}

/** Reconciles a key list to a `length` the ops did not cause: keep the prefix, grow fresh, shrink by truncation. */
function reconcileKeys(current: readonly string[], length: number, seq: { current: number }): string[] {
  const keys = current.slice(0, length);
  while (keys.length < length) keys.push(makeKey(seq));
  return keys;
}

/** Swaps two key slots in place (indices assumed in range, mirroring `AppArrayApi`). */
function swapKeys(keys: string[], indexA: number, indexB: number): void {
  const valueA = keys[indexA];
  const valueB = keys[indexB];
  if (valueA === undefined || valueB === undefined) return;
  keys[indexA] = valueB;
  keys[indexB] = valueA;
}

/** Moves a key slot in place (indices assumed in range). */
function moveKey(keys: string[], fromIndex: number, toIndex: number): void {
  const [moved] = keys.splice(fromIndex, 1);
  if (moved === undefined) return;
  keys.splice(toIndex, 0, moved);
}

/**
 * Row-render helper for the array at `path`. `TItem` is the row element type; row fields bind
 * one level deep (`keyof TItem`), typed, cast-free. Reuses `form.array(path)` for the ops
 * (row + error/touched reindexing stays in the adapter) and subscribes to the array LENGTH
 * only, so a row container re-renders on structural changes but not on per-row field edits —
 * each `array.Field` owns its own value subscription. Works identically on `house` + `tanstack`.
 *
 * `rows` / `length` are live getters, so `v-for="row in array.rows"` reads the current rows on
 * every render; destructuring the returned object takes a snapshot of both.
 */
export function useFieldArray<TItem extends object>(form: FieldArrayForm, path: string): FieldArray<TItem> {
  const ops = form.array(path);

  // Reactive row count. A length-only selector (`Object.is` on the number) means field edits —
  // which change the array reference but not its length — don't re-render the container.
  const storeLength = form.useFormState((state) => {
    const value = getPath(state.values, path);
    return Array.isArray(value) ? value.length : 0;
  });

  // Stable row keys the helper OWNS, moved in lockstep with the ops.
  const seq = { current: 0 };
  const keysRef = shallowRef<string[]>(buildKeys(storeLength.value, seq));

  // A length change no op of ours caused — `reset(data)`, a whole-array `setValue`. `flush: 'sync'`
  // so the keys reconcile in the same tick as the store commit and no read can see a stale list;
  // after one of our own ops the lengths already agree, so this is a no-op there.
  watch(
    storeLength,
    (length) => {
      if (keysRef.value.length !== length) keysRef.value = reconcileKeys(keysRef.value, length, seq);
    },
    { flush: 'sync' },
  );

  const rows = computed<readonly FieldArrayRow[]>(() => keysRef.value.map((key, index) => ({ key, index })));

  const Field = defineComponent({
    name: 'FieldArrayField',
    props: {
      index: { type: Number, required: true },
      name: { type: String, required: true },
      // `default: undefined` per optional boolean — an undefaulted `Boolean` prop is cast to `false`.
      isDisabled: { type: Boolean, default: undefined },
      isRequired: { type: Boolean, default: undefined },
      isReadOnly: { type: Boolean, default: undefined },
    },
    setup(props, { slots }) {
      // The contract's `Field` is typed as a constructor for `TPath` inference; `h` wants the
      // runtime component behind it. One cast, at the one seam that needs it.
      const GlueField = form.Field as unknown as Component;
      return () =>
        h(
          GlueField,
          {
            name: `${path}[${props.index}].${props.name}`,
            isDisabled: props.isDisabled,
            isRequired: props.isRequired,
            isReadOnly: props.isReadOnly,
          },
          {
            // The one `unknown → element` cast — sound by construction (`${path}[${index}].${name}` is `TItem[name]`).
            default: (field: AppFieldApi<unknown>) =>
              slots.default?.(field as AppFieldApi<TItem[keyof TItem & string]>),
          },
        );
    },
  }) as unknown as FieldArrayField<TItem>;

  // Each op moves the keys the SAME way it moves the rows, publishes the new list, then delegates
  // to `form.array` (the adapter reindexes row-scoped errors + touched). The list is REPLACED, not
  // mutated, so swap/move — which keep the length — still publish.
  const apply = (mutateKeys: (keys: string[]) => void, run: () => void): void => {
    const next = [...keysRef.value];
    mutateKeys(next);
    keysRef.value = next;
    run();
  };

  return {
    get rows() {
      return rows.value;
    },
    get length() {
      return rows.value.length;
    },
    Field,
    push: (value: TItem) =>
      apply(
        (next) => next.push(makeKey(seq)),
        () => ops.push(value),
      ),
    insert: (index: number, value: TItem) =>
      apply(
        (next) => next.splice(index, 0, makeKey(seq)),
        () => ops.insert(index, value),
      ),
    remove: (index: number) =>
      apply(
        (next) => next.splice(index, 1),
        () => ops.remove(index),
      ),
    swap: (indexA: number, indexB: number) =>
      apply(
        (next) => swapKeys(next, indexA, indexB),
        () => ops.swap(indexA, indexB),
      ),
    move: (fromIndex: number, toIndex: number) =>
      apply(
        (next) => moveKey(next, fromIndex, toIndex),
        () => ops.move(fromIndex, toIndex),
      ),
  };
}
