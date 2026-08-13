# Migrating `@wow-two-beta/ui` → `@wow-two-beta/ui-vue`

*Last updated: 2026-08-13*

> One list of everything that changes when an app moves from the React package to the Vue port.
> Assembled by diffing the two packages' source, not from the port's per-wave notes.

The port keeps React's **export names**, **subpath map**, **token contract**, and **prop
vocabulary** wherever Vue allows it. Almost every delta below is forced by a framework
difference, not a redesign. Read [§1](#1-changes-that-apply-everywhere) first — it covers the
majority of call sites; the per-module sections only list what §1 does not predict.

---

## Contents

| § | Section |
|---|---|
| 0 | [Package swap](#0-package-swap) |
| 1 | [Changes that apply everywhere](#1-changes-that-apply-everywhere) |
| 2 | [The controlled / `v-model` convention](#2-the-controlled--v-model-convention) |
| 3 | [Compound components lost dot-access](#3-compound-components-lost-dot-access) |
| 4 | [Per-group component deltas](#4-per-group-component-deltas) |
| 5 | [`foundation/hooks` — composables](#5-foundationhooks--composables) |
| 6 | [`foundation/primitives`](#6-foundationprimitives) |
| 7 | [`forms-engine`](#7-forms-engine) |
| 8 | [`router`](#8-router) |
| 9 | [`query`](#9-query) |
| 10 | [`auth` · `flags` · `analytics` · `feedback`](#10-auth--flags--analytics--feedback) |
| 11 | [Known gaps](#11-known-gaps) |
| 12 | [Traps we hit](#12-traps-we-hit-for-anyone-extending-the-package) |

---

## 0. Package swap

```bash
pnpm remove @wow-two-beta/ui
pnpm add @wow-two-beta/ui-vue
```

The subpath map is 1:1 with the React package, so most import lines change only in the specifier:

```diff
- import { Button } from '@wow-two-beta/ui/presentation/actions';
+ import { Button } from '@wow-two-beta/ui-vue/presentation/actions';
```

### Peers

| Peer | Required | Needed by |
|---|---|---|
| `vue` `^3.5` | yes | everything |
| `vue-router` `^4` | optional | `/router` only |
| `@tanstack/vue-query` `^5` | optional | `/query` only |
| `@tanstack/vue-form` `^1` | optional | `/forms-engine/tanstack` only |

The root entry (`@wow-two-beta/ui-vue`) and every `foundation` / `domain` / `presentation`
subpath are peer-free — importing them never pulls `vue-router` or either TanStack package.
Same isolation the React package had.

### The root barrel

`import { … } from '@wow-two-beta/ui-vue'` re-exports exactly what the React root did:

- namespaced: `utils`, `hooks`, `icons`, `primitives`, `themes`, `color`, `emoji`
- flat: all seven `presentation/*` groups

`router`, `query`, `forms-engine`, `auth`, `feedback`, `analytics` and `flags` are **not** on the
root — reach them by subpath, exactly as in React.

---

## 1. Changes that apply everywhere

These are mechanical and apply across all 231 components. Nothing else in this document repeats
them.

| React | Vue | Notes |
|---|---|---|
| `forwardRef` + `ref` prop | `defineExpose` / `$el` on the template ref | No component forwards a ref. A `ref="x"` on a component gives the instance; `x.value.$el` is its root element. Components that expose an imperative API declare it with `defineExpose`. |
| `children` prop | default slot | `<Modal>…</Modal>` reads the same; a `children: (x) => …` render prop becomes a **scoped** slot. |
| Node-valued props (`icon`, `title`, `label`, `trailing`, `start`, `aside`, `separator`, `emptyContent`, …) | named slots | 78 components ship named slots; the common names are `label` (27), `description` (17), `title` (14), `icon` (14), `actions` (9), `trailing` (7), `leading` (5). |
| `*Slot` props on `Button` and friends (`leadingSlot`, `trailingSlot`, `hoverSlot`, `loadingSlot`) | **kept as props**, typed `VNodeChild`, with a same-named slot preferred | Both work. The prop stays for API parity; the slot is the idiomatic form. |
| Callback props `onXChange` | emits, kebab-cased | `onOpenChange` → `@open-change`, `onValueChange` → `@value-change`, `onPageChange` → `@page-change`, `onSelect` → `@select`. |
| Native DOM handlers (`onClick`, `onInput`, `onBlur`, …) | fallthrough listeners | Not declared as emits. `@click`, `@input` land on the underlying element unchanged. |
| `className` | `class` | Every component sets `inheritAttrs: false` and merges `attrs.class` through `cn()`, so the consumer's classes still win over the variant classes — same precedence React's `cn(variants(), className)` gave. |
| `style` | `style` | Fallthrough, same as `class`. |
| `Slot` + `asChild` | `Primitive` + `asChild` | See [§6](#6-foundationprimitives). `asChild` itself is unchanged on every component that had it. |
| `extends ButtonHTMLAttributes<T>` etc. on the props interface | dropped from the **typed** surface | Every DOM attribute still works via Vue's attribute fallthrough; it is just no longer type-checked as part of `XProps`. Where a component reads a DOM prop itself (`id`, `disabled`, `required`, `readOnly`, `value`, `checked`) it declares it explicitly. |
| `ReactNode` | `VNodeChild` | In prop types. |
| `React.CSSProperties` | `StyleValue` | In prop types. |
| Compound statics (`Modal.Content`) | flat sibling exports (`ModalContent`) | See [§3](#3-compound-components-lost-dot-access). |

### Callback props that did **not** become emits

Vue removes a declared emit's listener from `useAttrs()`, so a component cannot detect whether a
listener was passed. Where the *presence* of a callback changes what renders, or where the
callback's return value is consumed, it stayed a prop:

| Component | Prop | Why it stayed a prop |
|---|---|---|
| `AudioWaveform` | `onSeek` | Presence picks `role="slider"` vs `role="img"` when `isInteractive` is omitted. |
| `HeatmapCalendar` | `onCellClick` | Presence picks `<button>` vs an inert `<div>` per cell. |
| `ScheduleView` | `onSlotClick` | Presence is what renders the empty-slot overlay at all. |
| `ReactionPicker` | `onMore` | Presence is what renders the trailing "more" button. |
| `DataTable` | `onRowClick` | Presence decides whether rows are interactive. |
| `PullToRefresh` | `onRefresh` | Returns a `Promise` the component awaits. |
| `ResizablePanels` | `onSizesChange` | Invoked during a drag, ahead of the reactive commit. |
| `DismissableLayer` | `onEscape`, `onOutsidePointerDown` | Return-value / `preventDefault` contract. |
| `FocusScope` | `onMountAutoFocus`, `onUnmountAutoFocus` | Same. |

Everything else that was `onX` in React is an emit.

---

## 2. The controlled / `v-model` convention

Every stateful component accepts **both spellings** of its controlled prop and fires **both**
events, so `v-model` works without giving up React's names.

```vue
<!-- all three are the same component, same state -->
<Modal v-model:open="isOpen">…</Modal>
<Modal :open="isOpen" @open-change="isOpen = $event">…</Modal>
<Modal :is-open="isOpen" @open-change="isOpen = $event">…</Modal>
```

| React | Vue prop (v-model target) | Vue alias | Emits |
|---|---|---|---|
| `open` / `isOpen` + `onOpenChange` | `open` | `isOpen` | `update:open` + `open-change` |
| `value` + `onValueChange` | `modelValue` | `value` | `update:modelValue` + `value-change` |
| `isChecked` / `checked` + `onCheckedChange` | `modelValue` | `checked` | `update:modelValue` + `value-change` |
| `isSidebarOpen` + `onSidebarOpenChange` | `sidebarOpen` | `isSidebarOpen` | `update:sidebarOpen` + `sidebar-open-change` |
| `page` + `onPageChange` | `page` | — | `update:page` + `page-change` |
| `inputValue` + `onInputChange` | `inputValue` | — | `update:inputValue` + `input-change` |

Also aliased, for the DOM spelling vs React spelling split: `readonly` / `readOnly`,
`autocomplete` / `autoComplete`, and on `Label`, `for` / `htmlFor`.

Uncontrolled seeds (`defaultOpen`, `defaultValue`, `defaultChecked`) are unchanged.

**Set exactly one of the two spellings.** When both are set the winner is documented per
component, and it is not uniform across the package — see [§11](#11-known-gaps).

Components carrying the dual `open` / `isOpen` surface: `Modal`, `AlertModal`, `Drawer`,
`Popover`, `HoverCard`, `ActionSheet`, `BottomSheet`, `Tooltip`, `Collapsible`, `Menu`,
`DropdownMenu`, `CommandPalette`, `Select`, `EmojiPickerPopover`.

---

## 3. Compound components lost dot-access

React attached parts to the root with `Object.assign`, so `<Modal.Content>` resolved. A Vue SFC's
generated default export cannot carry statics cleanly, so parts ship as flat sibling exports —
the same names React already exported alongside the dotted form.

```diff
- import { Modal } from '@wow-two-beta/ui/presentation/overlays';
- <Modal.Trigger>Open</Modal.Trigger>
- <Modal.Content>…</Modal.Content>
+ import { Modal, ModalTrigger, ModalContent } from '@wow-two-beta/ui-vue/presentation/overlays';
+ <ModalTrigger>Open</ModalTrigger>
+ <ModalContent>…</ModalContent>
```

Affected (31): `Accordion` · `ActionSheet` · `AlertModal` · `AppShell` · `BottomSheet` ·
`Card` · `Carousel` · `Collapsible` · `Combobox` · `CommandPalette` · `ContextMenu` · `Drawer` ·
`DropdownMenu` · `Editable` · `HoverCard` · `List` · `Menu` · `Menubar` · `Modal` ·
`MultiSelect` · `NavigationMenu` · `OnboardingChecklist` · `Popover` · `ResizablePanels` ·
`Sortable` · `Stepper` · `Table` · `Tabs` · `Timeline` · `Tree` · `Wizard`.

Still dotted (kept an explicit `Object.assign` in their barrel): `SpeedDial`, `Toolbar`.

**Default exports** were also dropped, except on `SpeedDial`. React's `carousel`, `editable`,
`wizard`, `appShell`, `resizablePanels`, `commandPalette`, `actionSheet` and
`onboardingChecklist` folders each had `export { default }`; use the named export instead.

---

## 4. Per-group component deltas

Only deltas §1–§3 do **not** predict. A component absent from these tables changed only by the
mechanical rules.

**No component gained a prop in the port.** Where a Vue props interface lists something React's
did not, React was inheriting it through `extends ButtonProps` / `extends InputHTMLAttributes` /
`extends SurfaceVariants`; the Vue SFC spells it out because its compiler cannot follow those
heritage clauses ([trap 7](#12-traps-we-hit-for-anyone-extending-the-package)). The consumer-facing
name and meaning are unchanged, so those re-declarations are not listed below.

### actions (14)

| Component | React | Vue | Reason |
|---|---|---|---|
| `Button` | `onPressStart` · `onPressEnd` · `onLongPress` | `@press-start` · `@press-end` · `@long-press` | Emits. Every other prop is name-identical. |
| `Button` | `ButtonSize` not exported | `ButtonSize` exported | Variant unions are spelled out, so the enum became public. |
| `CopyButton` | `onError` | `@error` | Emit. |
| `DisclosureButton` | `onOpenChange` | `@open-change` | |
| `OptionTile` | `onSelect` + `children` | `@select` + default slot | |
| `SegmentedControl` · `ToggleButton` · `ToggleButtonGroup` | `onValueChange` / `onPressedChange` | `@value-change` / `@pressed-change` | |
| `SpeedDial` · `Toolbar` | `Object.assign` statics | still dotted **and** flat | The two exceptions to §3. |

### display (73)

| Component | React | Vue | Reason |
|---|---|---|---|
| `Card` | `Card.Header` … | `CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter` | §3. |
| `Sortable` | `Sortable.Item`, `.Handle` | `SortableItem`, `SortableHandle` + `useSortableRoot`, `useSortableItem` | §3, plus the context is now public. |
| `ModuleGlyphs` | four glyphs from one file | `DotsGlyph`, `VerticalBarsGlyph`, `HorizontalBarsGlyph`, `CellsGlyph`, each its own SFC | One component per file. Export list unchanged. |
| `Tooltip` | `open` + `onOpenChange` | `open` / `isOpen` + `@open-change` | §2. |
| `AudioWaveform` · `HeatmapCalendar` · `ScheduleView` · `DataTable` | callbacks | **still props** | §1, presence is load-bearing. |
| `Accordion` · `Carousel` · `Collapsible` · `Table` · `Tabs` · `Timeline` · `Tree` | context private | `useXContext` + `XContextValue` exported | `provide`/`inject` seam is public so app code can compose parts. |
| `Stat` | `StatTrend` not exported | `StatTrend` exported | |
| `Avatar` | `AvatarSize` not exported | `AvatarSize` exported | |

### feedback (27)

| Component | React | Vue | Reason |
|---|---|---|---|
| `Tour` · `UndoBar` | `onOpenChange` | `@open-change` | |
| `Toaster` | `className` | `class` | Fallthrough. |
| `FeedbackToasts` | forwards into `toast()` | forwards into `toaster.toast()` | The imperative handle is namespaced. |

### forms (74)

| Component | React | Vue | Reason |
|---|---|---|---|
| every input | `value` + `onChange`/`onValueChange` | `modelValue` (+ `value` alias) + `@update:modelValue` / `@value-change` | §2. |
| `Checkbox` · `Radio` · `Switch` | `checked` | `modelValue` (+ `checked` alias) | No `value` alias — `value` keeps its HTML meaning (the submitted value). |
| every input | `readOnly` | `readonly` **and** `readOnly` | DOM spelling added. |
| `PasswordInput` | `autoComplete` | `autocomplete` **and** `autoComplete` | Same. |
| `TextAreaInput` | also exported as `Textarea` / `TextareaProps` (deprecated alias) | alias dropped | The one-release deprecation expired. |
| `Select` | — | `selectTriggerVariants` exported | |
| `CheckboxGroup` · `RadioGroup` | context private | `useCheckboxGroup` / `useRadioGroup` + keys exported | |
| `ColorPicker` · `EmojiSizeControl` | `onValueChange` / `onChange` | `@value-change` | |
| `ColorSwatch` | `onClick` | fallthrough `@click` | |

### layout (24)

| Component | React | Vue | Reason |
|---|---|---|---|
| `AppShell` | `isSidebarOpen` + `onSidebarOpenChange`, `AppShell.Header` … | `sidebarOpen` / `isSidebarOpen` + `@update:sidebarOpen` / `@sidebar-open-change`; flat `AppShellHeader` … | §2 + §3. |
| `Navbar` | `start` · `center` · `end` node props | `start` / `center` / `end` slots | §1. |
| `TwoColumn` | `aside` node prop | `aside` slot | §1. |
| `Overlay` | `className` · `style` | fallthrough | §1. |
| `ResizablePanels` | `onSizesChange` | **still a prop** + `useResizableContext`, `PanelInfo` exported | §1. |
| `PullToRefresh` | `onRefresh` | **still a prop** | Returns a `Promise`. |

### nav (11)

| Component | React | Vue | Reason |
|---|---|---|---|
| `CommandPalette` | `onOpenChange` · `onSelect` · `onInputChange`, dotted parts | `@open-change` · `@select` · `@input-change` · `update:open` · `update:inputValue`; flat parts | §2 + §3. |
| `Menu` | `onClose` · `onKeyDown` | `@close` · `@keydown` | `keydown` fires ahead of the menu's own Tab handling, so a wrapper opts out with `preventDefault()`. `MenuItem`'s `onSelect` → `@select`. |
| `Menubar` · `NavigationMenu` | `onValueChange` | `@value-change` | |
| `Pagination` | `onPageChange` | `@page-change` + `update:page` | §2. |
| `ScrollSpy` | `onActiveChange` | `@active-change` | |
| `Breadcrumb` | `separator` node prop | `separator` slot | §1. |
| `NavItem` | `icon` · `trailing` node props | slots | §1. |
| all menu-family | context private | `useXContext` + injection keys exported | |

### overlays (8)

| Component | React | Vue | Reason |
|---|---|---|---|
| `Backdrop` | `open` | **`isOpen`, no `open` alias** | The one un-aliased rename in the package. `Backdrop` is presentational — it holds no state, so there is nothing to `v-model`. |
| `Modal` · `Drawer` · `Popover` · `HoverCard` · `ActionSheet` · `BottomSheet` · `AlertModal` | `open` + `onOpenChange` | §2 dual surface | |
| `AlertModal` | `onAction` | `@action` | |
| `ActionSheet` | `onSelect`, `title` / `description` node props | `@select`, `title` / `description` slots (props kept) | |
| `Popover` · `HoverCard` | arrow props inline | `PopoverArrowProps` · `HoverCardArrowProps` exported | |

---

## 5. `foundation/hooks` — composables

The subpath is still `foundation/hooks` (not `composables`) and every name is unchanged. Two
shape rules apply across the module:

1. **Reactive inputs.** Scalar arguments take `MaybeRefOrGetter<T>` — a bare value, a `ref`, or a
   getter. Passing a bare value still works; it just never re-evaluates.
2. **Ref outputs.** Anything that was a value read on re-render is now a ref. Read `.value` in
   script, bind directly in a template.

| Composable | React | Vue |
|---|---|---|
| `useControlled` | `({controlled, default, onChange}) => [T, (v: T) => void]` | `({controlled, default, onChange}) => { value: WritableComputedRef<T>, setValue }` — `value.value = next` runs `setValue`, so it drops into `v-model` |
| `usePersistentState` | `(key, initial, opts) => [T, SetPersistentState<T>]` | `(key: MaybeRefOrGetter<string>, initial, opts) => { value: WritableComputedRef<T>, setValue }` |
| `useDisclosure` | `(initial = false) => { isOpen: boolean, … }` | `(initial: MaybeRefOrGetter<boolean>) => { isOpen: Ref<boolean>, … }` |
| `useMediaQuery` | `(query: string) => boolean` | `(query: MaybeRefOrGetter<string>) => Readonly<ShallowRef<boolean>>` |
| `useReducedMotion` | `() => boolean` | `() => Readonly<ShallowRef<boolean>>` |
| `useClipboard` | `{ copied: boolean, error: Error \| null, … }` | `{ copied: Readonly<ShallowRef<boolean>>, error: Readonly<ShallowRef<Error \| null>>, … }` |
| `useAutosave` | `(value: T, save, opts)`; `{ status, lastSavedAt }` values | `(value: MaybeRefOrGetter<T>, save, opts)`; `status` / `lastSavedAt` are `ShallowRef` |
| `useRecentItems` | `{ recents: ReadonlyArray<T>, … }` | `{ recents: ComputedRef<ReadonlyArray<T>>, … }` |
| `useFocusTrap` | `(ref: RefObject<HTMLElement \| null>, enabled)` | `(target: MaybeRefOrGetter<HTMLElement \| null \| undefined>, enabled: MaybeRefOrGetter<boolean>)` |
| `useOutsideClick` | `(refs: RefObject \| RefObject[], handler, enabled)` | `(targets: OutsideClickTarget \| ReadonlyArray<OutsideClickTarget>, handler, enabled)` |
| `useResizeObserver` | `(ref: RefObject<T \| null>, cb, enabled)` | `(target: MaybeRefOrGetter<T \| null \| undefined>, cb, enabled)` |
| `useEventListener` | `(event, handler, target = document, opts)` | all four params `MaybeRefOrGetter`; `target` defaults to a **getter** that returns `null` under SSR |
| `useDebounceHandler` | `<E extends SyntheticEvent>` | `<E extends Event = Event>`; `ms` is `MaybeRefOrGetter` |
| `useEscape` · `useScrollLock` | `(…, enabled = true)` | `enabled: MaybeRefOrGetter<boolean>` |
| `useTypeahead` | `items: readonly T[] \| (() => readonly T[])` | `items: MaybeRefOrGetter<readonly T[]>` |
| `useId` · `useTypeahead` return · `prependRecent` | — | unchanged |

New exported types: `ControlledValue`, `PersistentState`, `OutsideClickTarget`.

---

## 6. `foundation/primitives`

All 17 primitives ported with their names intact. One rename:

| React | Vue |
|---|---|
| `Slot` + `Slottable` | `Primitive` (with `as` and `asChild` props) + `Slottable` |

`<slot>` is a reserved element in a Vue template, so a component registered as `Slot` would
shadow it — hence `Primitive`. The `asChild` contract is byte-for-byte the same: class
concatenated, handlers chained, child props winning.

```diff
- <Slot className="btn"><a href="/x">Open</a></Slot>
+ <Primitive as-child class="btn"><a href="/x">Open</a></Primitive>

  <!-- and the plain polymorphic form -->
+ <Primitive as="button" class="btn">Save</Primitive>
```

`Slottable` still marks the merge target when a primitive renders adornments around the
consumer's element. Also newly exported from `primitives/slot`: `mergeProps`, `renderSlotClone`,
`renderableChildren`, `AnyProps` — the seams an out-of-package primitive needs.

`Portal` still exists as a primitive and renders through `<Teleport>` internally; consumers see no
change. `Presence`, `FocusScope`, `DismissableLayer`, `RovingFocusGroup`, `AnchoredPositioner`,
`Collection`, `Announce`, `ScrollViewport`, `ScrollLockProvider`, `ColorModeProvider`,
`DirectionProvider`, `FormControlContext`, `AccessibleIcon`, `OverlayArrow`, `VisuallyHidden` are
name- and prop-identical.

---

## 7. `forms-engine`

The largest ergonomic win, and the one place where the migration is not mechanical.

### `<form.Subscribe>` is gone

React's read path was a render prop, and it nested — four reads meant four levels. In Vue,
**reading `form.values.x` or `form.state.x` in a template *is* the subscription.** The component,
its `AppSubscribeProps` / `AppSubscribeComponent` types, and `createSubscribeComponent` are all
removed.

```tsx
// React — 4 reads, 4 levels of nesting
<form.Subscribe selector={(s) => s.values.style}>
  {(style) => (
    <form.Subscribe selector={(s) => s.isSubmitting}>
      {(isSubmitting) => (
        <form.Subscribe selector={(s) => s.isValid}>
          {(isValid) => (
            <form.Subscribe selector={(s) => s.values.size}>
              {(size) => (
                <Button isLoading={isSubmitting} isDisabled={!isValid}>
                  Save {style} @ {size}
                </Button>
              )}
            </form.Subscribe>
          )}
        </form.Subscribe>
      )}
    </form.Subscribe>
  )}
</form.Subscribe>
```

```vue
<!-- Vue — the same 4 reads -->
<Button :is-loading="form.state.isSubmitting" :is-disabled="!form.state.isValid">
  Save {{ form.values.style }} @ {{ form.values.size }}
</Button>
```

`form.state` exposes live getters — **bind to `form.state`, never destructure it.** `form.values`
is shorthand for `form.state.values`.

### `form.useFormState` survives, narrowed

It keeps the one capability plain reactivity cannot express: a **composite** selection with a
custom equality. `computed` always compares with `Object.is`, so `() => ({ a, b })` invalidates
every downstream effect on any store commit; pass `isEqual` and the previous slice is kept.

```ts
// React: returns TSlice          Vue: returns Readonly<Ref<TSlice>>
const slice = form.useFormState((s) => ({ a: s.values.a, b: s.values.b }), shallowEqual);
watch(slice, (next) => …);
```

Single-member reads want `form.state` instead.

### `<form.Field>`

The render prop became a scoped slot, and `field.value` is now **writable** — a control binds with
`v-model="field.value"` and needs no `@update` handler. `setValue` is still there.

```diff
- <form.Field name="title">
-   {(field) => (
-     <TextInput value={field.value} onValueChange={field.setValue} onBlur={field.onBlur} />
-   )}
- </form.Field>
+ <form.Field name="title" v-slot="field">
+   <TextInput v-model="field.value" @blur="field.onBlur" />
+ </form.Field>
```

### Type and option changes

| React | Vue | Reason |
|---|---|---|
| `useAppForm(options)` | `useAppForm(options)` where options is `AppFormOptionsSource<TValues>` = `MaybeRefOrGetter<AppFormOptions<TValues>>` | Options can be reactive (a getter re-seeds `defaultValues`). |
| `AppFieldProps<TValues, TPath>` | `AppFieldProps<TPath>` | The values type moved onto `AppFieldComponent`. |
| — | `AppFieldPath<TValues>` = `(keyof TValues & string) \| (string & {})` | Keeps a template-literal `name="title"` from widening to `string` — see [trap 5](#12-traps-we-hit-for-anyone-extending-the-package). |
| `handleSubmit(event?: FormEvent)` | `handleSubmit(event?: Event)` | |
| `createSubscribeComponent` | *removed* | |
| — | `createFieldApi`, `createFormStateView`, `createUseFormState`, `FieldSlice`, `FieldOps` | New adapter-author seams. |
| — | `FieldArrayGlueField`, `FieldArrayGlueFieldProps` | New. |

`handleSubmit`, `validate`, `setValue`, `array`, `reset`, `setFieldErrors`, `clearSubmitError`,
`engine`, `AppFormOptions`, `AppFormState`, `AppFieldApi`, `AppArrayApi`, `StandardSchemaV1`,
`useFieldArray`, `focusFirstInvalid`, `defaultMapFieldPath`, `resolveSubmitFailure`,
`runStandardSchema` and the `Paths` helpers are unchanged.

`/forms-engine/house` and `/forms-engine/tanstack` export the same names as their React
counterparts (`useAppForm`, `houseFormEngine`, `HouseFormEngine`, `HouseFieldState`).

---

## 8. `router`

The largest API delta in the port. `vue-router` installs as a plugin, has no root element, and
expresses "on every navigation" as `afterEach` — so React's `<AppRoot>` layout route, which
composed five behaviours, is gone.

### Mounting

```diff
- const router = createAppRouter(routes, { titleSuffix: ' · Acme' });
- <RouterProvider router={router} />
+ const router = createAppRouter(routes, { titleSuffix: ' · Acme' });
+ app.use(router);
```

`createAppRouter` takes the same `(config, options)` and installs all the root behaviours itself,
so an app that only calls `createAppRouter` sees no behavioural difference.

### `AppRoute`

| React | Vue |
|---|---|
| `element?: ReactNode` | `component?: Component` |
| `errorElement?: ReactNode` | `errorComponent?: Component` |
| `redirect?: string` | `redirect?: RouteLocationRaw` |
| `layout?: ComponentType` | `layout?: Component` |
| `path` · `index` · `lazy` · `guard` · `handle` · `children` · `id` | unchanged |

For an app that only declares routes, **`element:` → `component:` is the whole migration.**

### Root behaviours: components → install hooks

Each returns its own unregister function.

| React (mounted under `<AppRoot>`) | Vue |
|---|---|
| `<DocumentTitle/>` | `installDocumentTitle(router, options?)` |
| `<DocumentMeta/>` | `installDocumentMeta(router)` |
| `<RoutePersistence/>` | `installRoutePersistence(router, options?)` |
| `<PageViewTracker/>` | `installPageViewTracker(router, options?)` |
| scroll restoration | folded into `createRouter`'s `scrollBehavior` |
| `<RouteAnnouncer/>` | **still a component** — it owns a live region |

### Options

| React | Vue |
|---|---|
| `errorElement?: ReactNode` | **removed** — mount `<AppErrorBoundary>` yourself (now exported) |
| `notFound?: ReactNode` | `notFound?: Component` |
| `history?: RouterHistory` | `history?: RouterHistoryMode` (`RouterHistory` still exported as the value enum) |
| — | `routePersistence?: RoutePersistenceOptions \| false` |
| `basename` · `scrollRestoration` · `titleSuffix` · `onPageView` | unchanged |

### Route metadata

Guards replace loaders. A route's `guard` chain compiles to the record's `beforeEnter`, and its
`handle` compiles to the record's native `meta`:

```diff
- const matches = useMatches();
- const title = matches.at(-1)?.handle?.title;
+ const title = route.meta.title;
```

There is **no `useMatches()`** — `route.meta` is the replacement, and needs no helper.

### Newly exported

`NotFound`, `AppErrorBoundary`, `ProgressProvider`, `NavigationProgressMode`,
`NavigationProgressVariant`, `createNavigationProgress`, `provideNavigationProgress`,
`NavigationProgressKey`, `useRouteNavigating`, `BlockerState`, `NavigationBlocker`, `CrumbNode`,
and a `*Props` type per component.

Unchanged: `definePath`, `PathBuilder`, `useTypedSearchParams`, `requireAuth`, `buildReturnTo`,
`resolveReturnTo`, `useReturnTo`, `AppNavLink`, `useBreadcrumbs`, `usePrefetch`, `prefetch`,
`prefetchProps`, `useNavigationBlocker`, `lazyRoute`, `reloadOnChunkError`.

---

## 9. `query`

`@tanstack/vue-query` returns a **ref per field** and takes `MaybeRefOrGetter` options, so the
whole module follows.

```diff
- const { data, isPending } = useAppQuery({ key, queryFn, map });
- if (isPending) return <Spinner/>;
- return <List items={data}/>;
+ const { data, isPending } = useAppQuery({ key, queryFn, map });
+ // template: <Spinner v-if="isPending"/> <List v-else :items="data"/>
+ // script:   data.value
```

| Change | Detail |
|---|---|
| every composable returns refs | `useAppQuery`, `useAppInfiniteQuery`, `useAppMutation`, `useAppQueries`, `useAppPaginatedQuery`, `useAppLazyQuery`, `useOptimisticMutation`. A `UseXReturn` type is now exported for each. |
| options take `MaybeRefOrGetter` | `key`, `enabled`, `page`, … A bare value works but never re-evaluates. |
| **`useAppSuspenseQuery` is `async`** | Vue suspends on an async `setup()`, not a thrown promise. `const { data } = await useAppSuspenseQuery({…})` inside `<script setup>`, under a `<Suspense>` boundary. |
| plugin install added | `app.use(queryPlugin, options)` is the idiomatic mount; `<QueryProvider>` still exists, rebuilt on the library's own injection key. |
| `QueryProgressBridge` | still a component; `useQueryProgressBridge` added as the composable form. |
| `QueryDevtools` | now an SFC with `QueryDevtoolsProps`. |

Unchanged: `createQueryClient`, `defineEndpoint`, `toApiError`, `byPageToken`, `pageItems`,
`useQueryCache`, `usePrefetchQuery`, `prefetchProps`, `setupQueryPersistence`, and the
`@wow-two-beta/ui-vue/query/testing` subpath.

---

## 10. `auth` · `flags` · `analytics` · `feedback`

### `auth`

| React | Vue |
|---|---|
| `useAuth()` returns plain values | returns the same `AuthApi` shape, but its four state members are **reactive getters**. Read them off the object; **destructuring snapshots.** |
| `AuthProvider` + `useAuth` from one module | `AuthProvider` (SFC) and `useAuth` from `./AuthContext` — same import path, same names |
| me-resolve deduped by StrictMode | deduped through a shared in-flight promise; runs from `onMounted`, so it never fires under SSR |
| `AuthProviderProps` includes `AuthApi` | `AuthApi` exported separately |

`createAuthBridge`, all three strategies, `createMemoryTokenStorage`, `AuthStatus`, `AuthSession`
unchanged.

### `flags`

| React | Vue |
|---|---|
| `useFlag(key, defaultValue) => TValue` | `=> ComputedRef<TValue>`, and `key` / `defaultValue` accept `MaybeRefOrGetter` |
| `useFlags() => FlagClient` | unchanged |
| `FlagsProvider` | SFC, same props |

Everything below the seam (`createFlagClient`, `staticFlagProvider`, `FlagReason`,
`FlagErrorCode`, the whole vocabulary) is byte-identical.

### `analytics`

The only module that is a byte-for-byte copy apart from its header. No API change.

### `feedback`

`NoticeNode` is newly exported (the `VNode`-typed notice body). `FeedbackNotice`,
`createFeedbackBus`, `feedbackBus`, `notify`, `NoticeTone`, `feedbackQueryErrors`,
`toErrorNotice` unchanged.

### `domain/color` · `domain/emoji` · `foundation/themes` · `foundation/icons`

No API change. `foundation/utils` drops one export — see below.

---

## 11. Known gaps

Honest list. Everything here is present in `@wow-two-beta/ui` and absent, narrower, or
inconsistent in `@wow-two-beta/ui-vue`.

### 11.1 Twenty `foundation` modules are not ported

React ships 41 `foundation` modules; the Vue package has 21. Missing:

`animation` · `clipboard` · `commands` · `device` · `geolocation` · `gestures` · `i18n` ·
`media` · `net` · `notifications` · `observers` · `screen` · `selection` · `share` · `speech` ·
`sync` · `undo` · `uploads` · `virtualization` · `workers`

`i18n` is the most load-bearing of these — `LocaleProvider` and the `Intl` formatter set have no
Vue equivalent yet.

This list is a snapshot; the remaining-foundation wave is in flight. The reliable test is whether
`src/foundation/<name>/index.ts` exists — a folder without one is mid-port and not yet importable.

> **`package.json` declares subpath exports for all 41.** The 20 unported ones point at `dist`
> paths that are never emitted (the Vite config filters entries by file existence), so
> `import … from '@wow-two-beta/ui-vue/foundation/i18n'` fails at resolve time rather than with a
> clear error. Treat the export map as aspirational until the modules land.

### 11.2 `presentation` is complete

All seven groups match the React package folder-for-folder and barrel-line-for-barrel-line:
`actions` 14 · `display` 73 · `feedback` 27 · `forms` 74 · `layout` 24 · `nav` 11 · `overlays` 8
— 231 components, 401 SFCs. `forms` closed last; if a form control looks missing, re-check
`src/presentation/forms/index.ts` rather than assuming a gap.

### 11.3 Dropped exports

| Subpath | Dropped | Replacement |
|---|---|---|
| `foundation/utils` | `composeRefs` | Vue merges template refs itself; a component that must forward one uses `defineExpose`. |
| `presentation/forms` | `Textarea`, `TextareaProps` | `TextAreaInput`, `TextAreaInputProps`. The React alias was already deprecated. |
| `forms-engine` | `AppSubscribeProps`, `AppSubscribeComponent`, `createSubscribeComponent`, `form.Subscribe` | Read `form.state` / `form.values`; [§7](#7-forms-engine). |
| `router` | `AppRoot`, `DocumentTitle`, `DocumentMeta`, `RoutePersistence`, `PageViewTracker` as components; `CreateAppRouterOptions.errorElement` | `install*` hooks; mount `<AppErrorBoundary>` yourself. |
| `router` | `useMatches()` | `route.meta`. |
| presentation | `export default` on 8 component folders | Named exports. |

### 11.4 Alias precedence is not uniform

When both spellings of a controlled prop are set, the winner differs by component:

- **`value` wins** in 25 components (`AddressForm`, `ChatComposer`, `CheckboxGroup`, `CodeEditor`,
  `ColorSlider`, `ColorWheel`, `Combobox`, `CronInput`, `Editable`, `FontPicker`, `GradientPicker`,
  `IconPicker`, `JSONEditor`, `KeyboardShortcutPicker`, `Knob`, `MarkdownEditor`, `MaskedInput`,
  `MultiSelect`, `PasswordInput`, `PhoneInput`, `PinInput`, `RecurrenceEditor`, `Slider`,
  `Stepper`, `TagsInput`)
- **`modelValue` wins** in 14 (`DateField`, `DateTimeField`, `EmailInput`, `EmojiPicker`,
  `EmojiPickerPopover`, `Listbox`, `NumberInput`, `SearchInput`, `Select`, `TelInput`,
  `TextAreaInput`, `TextInput`, `TimeField`, `UrlInput`)

Several of the `modelValue`-first components carry a doc comment claiming `value` wins — the
comment is wrong, the code is right. **Set exactly one spelling and the ambiguity never arises.**

For `open` / `isOpen` the precedence is uniform: `open` wins everywhere.

### 11.5 Narrower behaviour

| Item | Detail |
|---|---|
| `Backdrop` | React's `open` prop is spelled `isOpen`, with no alias. |
| Compound dot-access | `<Card.Header>` no longer resolves anywhere except `SpeedDial` and `Toolbar`. |
| Prop-type coverage | `XProps` no longer extends the DOM attribute interfaces, so a typo in a passthrough DOM attribute is no longer a type error — it lands as a stray attribute. |
| `display/index.ts` | Carries a stale comment claiming three folders are held back; the barrel is in fact complete. Cosmetic. |
| Tests | The port ships a smoke layer (mount + a11y), not the React package's story-driven interaction suite. |

---

## 12. Traps we hit (for anyone extending the package)

Each of these passes `vue-tsc`, `eslint` **and** the SFC-compiler check, then renders wrong. Full
record in `engineering/planning/vue-port-track.md`.

1. **An optional `Boolean` prop with no default is cast to `false`.** Any tri-state boolean whose
   `undefined` is meaningful needs an explicit `x: undefined` in `withDefaults`. This is why every
   `isDisabled` / `isLoading` / `open` in the package declares `undefined`.

2. **`VNodeChild`-typed props are Boolean-castable.** `VNodeChild` includes `boolean`, so an
   absent node prop arrives as `false`, not `undefined` — every `x !== undefined` guard reads
   truthy and the component locks into the wrong branch. `Button` rendered hover-swap markup on
   every instance and never showed its spinner. Needs `default: undefined` per node-valued prop.

3. **A declared hyphenated prop is camelized.** Declaring `'aria-label'` delivers it as
   `props.ariaLabel`, so `props['aria-label']` is always `undefined`. Six components shipped with
   no accessible name. Keep `aria-*` as fallthrough attrs; reach it via `attrs['aria-label']` when
   an inner node needs it.

4. **Chained listeners arrive as arrays.** A wrapper binding `@click` over a forwarded `onClick`
   gives the inner component an array in `attrs.onClick`; invoking it throws. Normalise first.

5. **A `TPath extends string` type param is literal-widened when the template tag is resolved.**
   `name="title"` infers as `string`, not `"title"`, so a path-derived slot payload silently
   degrades to `unknown`. A plain `.ts` call site infers correctly, which is what makes the
   regression invisible without a template-level test. Constrain with a type that contains
   literals: `(keyof TValues & string) | (string & {})`.

6. **`inheritAttrs: false` + `cn(attrs.class)`, never `inheritAttrs: true`.** Fallthrough
   concatenates `class` without `tailwind-merge`, losing React's consumer-wins precedence.

7. **`vue-tsc` green ≠ buildable.** `@vue/compiler-sfc` resolves `defineProps<T>()` with its own,
   narrower resolver. `scripts/check-sfc.mjs` runs the real `compileScript` over every SFC and is
   wired into `pnpm typecheck`. `VariantProps<typeof xVariants>` throws
   `Failed to resolve extends base type` there — either spell the union out or put
   `/* @vue-ignore */` on the heritage clause.

8. **Reactive granularity is not free.** Exposing state through raw getters wakes every reader on
   every commit — the TanStack form engine fired 7 effect runs for 2 writes. Back each state
   member and each field slice with its own `computed`.

9. **SSR crashes from `immediate: true, flush: 'post'` watchers.** Vue runs those on the server,
   so a browser global touched inside one (`requestAnimationFrame`, `HTMLElement`) crashes SSR.
   Four components shipped this shape.

10. **Callback presence is load-bearing.** Vue strips a declared emit's listener out of
    `useAttrs()`, so a callback whose presence picks an element or a role must stay a prop. See
    the table in [§1](#1-changes-that-apply-everywhere).
