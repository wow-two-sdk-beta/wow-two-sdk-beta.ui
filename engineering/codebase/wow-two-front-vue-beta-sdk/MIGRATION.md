# Vue convention-sweep migration

*Last updated: 2026-09-10*

This is the breaking migration for the current Vue sweep. The release version is not yet assigned.
React is parked and has a different public API; importing the Vue package is not a symbol-for-symbol package swap.

## Entry points

| Retired entry | Replacement |
|---|---|
| `foundation/format` | `foundation/formatters` |
| `foundation/sync` | `foundation/channels` |
| `foundation/undo` | `foundation/history` |
| `foundation/validation` | `foundation/validators` |
| `foundation/utils` | Capability-specific entries below |
| `foundation/hooks` | Capability-specific composables below |

Utility ownership:
- `foundation/styles`: class merging, variants, styles and visual tokens.
- `foundation/dom`: element/ARIA/event vocabulary, DOM and keyboard operations, polymorphic helpers.
- `foundation/animation`: transition operations.
- `foundation/collections`: equality comparers.
- `foundation/i18n`: locale-aware comparison.
- `foundation/config`: environment flags.
- `foundation/optionals`: optional-value construction.

The root `utils` and `hooks` namespaces are removed. Root `styles`, `dom`, `optionals` and `state` namespaces are available;
use dedicated subpaths for the other capabilities. Vue Query requires `^5.102.8`;
`query/testing` additionally requires optional `@vue/test-utils@^2.4.6`.

## Composable ownership

The generic hooks entry is retired. Import each composable from its owning capability:

| Capability | Former generic composables |
|---|---|
| `foundation/state` | controlled state, disclosure |
| `foundation/dom` | event listeners, outside clicks, focus trapping, scroll locking |
| `foundation/shortcuts` | Escape key |
| `foundation/identifiers` | identifiers |
| `foundation/device` | media queries, reduced motion |
| `foundation/observers` | resize observers |
| `foundation/async` | debounced handlers |
| `foundation/storage` | autosave, persistence, recent items |
| `foundation/selection` | typeahead |
| `foundation/clipboard` | clipboard controls |

Source role grouping does not rename other public capability entries. Forms source uses
`formsEngine/adapters/{house,tanstack}`; its public entries remain `forms-engine/house` and
`forms-engine/tanstack`. The storage adapter remains `foundation/storage/zustand` publicly.

## Exact numeric JSON prototype

New `foundation/numbers` and `foundation/json` entries expose `ExactNumber` and `LosslessJson`.
Configure `createApiClient({ json: LosslessJson })` to preserve numeric tokens in requests, responses and
diagnostics. This is explicit opt-in; all numeric response fields become ExactNumber and need matching
endpoint decoders. Encoding native fractional/unsafe numbers fails; construct exact values from their
original decimal text or bigint. Native arithmetic/JSON operators do not implement this value type.

Both form adapters preserve immutable ExactNumber values in snapshots and use numeric equality for dirty
tracking. Existing number-valued controls and schemas are not automatically converted to exact-number
controls. Use text-based editing and an explicit parser at that boundary.

`ApiFailure.problem` and `ApiError.problem` are raw readonly records: validate their members before use.
The HTTP transport's `failure.status` stays a native number; a numeric diagnostic body member retains the
selected codec's representation. The separately exported `ProblemDetails` model remains available for
validated contracts.

## Component models and events

The canonical model sweep updates 95 component surfaces. Use these model names on the renamed
components in the family table below; old aliases and duplicate change notifications are removed.

| Previous binding | Current binding |
|---|---|
| Primary `value` / `update:value` or `value-change` | `modelValue` / `update:modelValue` |
| Checkbox, radio and switch `checked` / `defaultChecked` | `modelValue` / `defaultValue` |
| Toggle `isPressed` / `defaultPressed` | `modelValue` / `defaultValue` |
| Tree `selection` | `modelValue` / `defaultValue` |
| Emoji size picker `sizeRatio` | `modelValue` |
| Disclosure `isOpen` and alternate open notifications | `open` / `defaultOpen` / `update:open` |
| Independently writable secondary state | Named `v-model`, such as `v-model:page` or `v-model:zoom` |

An absent controlled Boolean stays absent so its uncontrolled seed can apply. `defaultValue` and
`defaultOpen` seed uncontrolled state; use the matching model prop/event pair for controlled state.
Stateless item keys, read-only display values and visibility flags do not become primary models.
ColorArea retains independent HSV `saturation` and `value` axes. SelectPicker emits the selected key
through `update:modelValue`; its former option-object `value-change` event is removed.
Named model axes include `inputValue`, `editing`, `view`, `mode`, `date`, `currentStep`, `sidebarOpen`,
`page`, `zoom`, `index`, `sortBy`, `expanded`, `nodes` and `sizes`; consult each adjacent component spec.

## Completed operations

House operations use `Result<TSuccess, TFailure>`:

```ts
const result = await copyText('Example');
if (!result.ok) {
  handleClipboardFailure(result.failure);
}
```

Read successful values from `result.value`. Browser failure categories are under `result.failure.status`.
Clipboard reads return strings/items, media acquisition returns MediaStream, notifications return Notification,
geolocation returns Position, and wake-lock acquisition returns its handle.
Void operations return `value: undefined` on success. Share-or-copy returns `shared` or `copied`.
Reactive controls keep explicit pending/current state; a permission-state read is not a completed-operation Result.

Native validators use the shared Result. Third-party Standard Schema still uses its standard
`{ value } | { issues }` protocol. Do not wrap that protocol when passing a schema to a vendor.

## HTTP and query

HTTP returns `Result<unknown, ApiFailure>` for raw JSON. Typed data requires an explicit decoder.
Empty responses require `response: 'empty'`; callers cannot claim arbitrary successful data after a 204.
The global temporal reviver and unchecked `parseJson<T>` are removed: field schemas own dates,
durations, numeric precision, enum values and omission/null behavior.

`TemporalCodecs` from `foundation/datetime` provides named `instant`, `plainDate`, `plainTime`,
`isoDuration` and `clrTimeSpan` field codecs. Each has `decode(unknown)` and `encode(value)` methods
returning Result. CLR TimeSpan uses its constant wire format with exact 100 ns ticks; ISO duration
retains its separate calendar semantics. Neither codec inspects unrelated JSON fields.

Query callbacks return Result. The adapter rejects expected failures only at TanStack's internal boundary;
house mutation and lazy-fetch APIs return Result. Suspense follows Vue's error-boundary rejection protocol.
Supply the QueryClient explicitly to prefetch helpers; there is no shared default client.

## Auth and forms

Auth strategies and actions return Result. Bearer token exchanges return `BearerCredentials`;
logout clears local credentials immediately. Default redirect return URLs are application-local paths.
An explicit custom URL builder owns any alternate redirect trust policy.

Forms distinguish editing input from parsed output. `onSubmit` receives the parsed snapshot and returns
`Promise<Result<unknown>>`; `handleSubmit` returns the boolean submission verdict, with typed failure
available in state. Reset uses the current baseline; successful submissions advance it without replacing
newer editing values. Autosave coalesces later edits into a trailing save.

`onSubmit` receives a second `{ signal }` context; forward it to the transport. `cancelSubmit()` cancels
the current intent, while `invalidateSession(next?)` replaces session-owned form state. A transport
ignoring abort cannot restore obsolete form state; cancellation does not promise server rollback.
`validate({ fields?, schema? })` supports step gates; final submission always uses the whole configured
schema. Manual submissions focus the first invalid field or an error summary; imperative calls can
provide `focusRoot`.

The generic storage `useAutosave` serializes writes and retains the latest trailing intent. It accepts
void storage sinks and explicit Result sinks. Disposal cancels pending work rather than starting a hidden
write. `flush()` readies pending work and does not await durability; cancellation cannot undo a started sink.

`LocaleProvider` defaults to `en-US` on both server and client. Pass the same request locale to both;
apply browser preferences explicitly after hydration.

## Renamed public types

| Previous type | Current type |
|---|---|
| `UseWorkerResult` | `UseWorkerControls` |
| `UseUploadQueueResult` | `UseUploadQueueControls` |
| `AppQueryResult` | `AppQueryControls` |
| `MountWithQueryResult` | `MountWithQueryControls` |
| `RunWithQueryResult` | `RunWithQueryControls` |
| Credential exchange result | `BearerCredentials` |
| Router guard result | `GuardDecision` |
| `PositionResult` | `PositionReadResult` |
| `MediaStreamResult` | `MediaStreamRequestResult` |
| `NotifyResult` | `NotificationShowResult` |
| `ShareResult` | `ShareSendResult` |
| `ShareOrCopyResult` | `ShareSendOrCopyResult` |
| `SpeakResult` | `SpeechSpeakResult` |
| Native `ValidationResult` | `ValidatorParseResult` |
| `RunInWorkerResult` | `WorkerRunResult` |
| `ScreenResult`, `ScreenValueResult<T>` | `ScreenRequestResult<T = void>` |
| `CommandRunOutcome` | `CommandRunResult` |
| `NotifyFailure` | `NotificationFailure` |
| `SpeakFailure` | `SpeechFailure` |
| `RunInWorkerFailure` | `WorkerRunFailure` |

## Theme contrast

Generated and authored themes now validate ordinary text, placeholders, translucent treatments and control
indicators against their declared host surfaces. Foreground, input-border and strong-border tokens changed;
branded fills, backgrounds and decorative borders remain unchanged. The default stylesheet has matching fixes.

`smart-qr` is now a candidate because its corrected foregrounds have not been visually revalidated in the
product. All 183 shipped themes pass the declared contrast pairs; this does not prove every possible custom
background, class override or component composition accessible. Application/custom backgrounds still need
their own rendered checks.

## Component family moves

Both the public name and group may change. Named compound subparts follow their renamed root;
native HTML tags, ARIA strings and independent domain enums keep their platform/domain spelling.

| Previous group/name | Current group/name |
|---|---|
| `forms/InputAddon` | `layout/InputAddonLayout` |
| `forms/AddressForm` | `forms/AddressEditor` |
| `forms/FileUpload` | `forms/FileUploadPicker` |
| `forms/Legend` | `display/LegendText` |
| `forms/Calendar` | `forms/CalendarPicker` |
| `forms/Radio` | `forms/RadioInput` |
| `forms/ChatComposer` | `forms/ChatComposerInput` |
| `forms/LabeledInput` | `forms/LabeledField` |
| `forms/FormErrorMessage` | `feedback/FieldErrorCallout` |
| `forms/Wizard` | `forms/WizardForm` |
| `forms/Listbox` | `forms/ListboxPicker` |
| `forms/Checkbox` | `forms/CheckboxInput` |
| `forms/Label` | `display/LabelText` |
| `forms/Slider` | `forms/SliderInput` |
| `forms/Stepper` | `display/StepperGroup` |
| `forms/Combobox` | `forms/ComboboxPicker` |
| `forms/RangeCalendar` | `forms/RangeCalendarPicker` |
| `forms/ColorWheel` | `forms/ColorWheelInput` |
| `forms/Editable` | `forms/EditableInput` |
| `forms/ColorSwatch` | `display/ColorSwatchPreview` |
| `forms/FormHelperText` | `display/FieldHelperText` |
| `forms/PasswordStrength` | `feedback/PasswordStrengthCallout` |
| `forms/Fieldset` | `layout/FieldsetLayout` |
| `forms/Switch` | `forms/SwitchInput` |
| `forms/Knob` | `forms/KnobInput` |
| `forms/Select` | `forms/SelectPicker` |
| `forms/CharacterCount` | `feedback/CharacterCountCallout` |
| `forms/MultiSelect` | `forms/MultiSelectPicker` |
| `forms/ColorSlider` | `forms/ColorSliderInput` |
| `forms/EmojiSizeControl` | `forms/EmojiSizePicker` |
| `forms/InputGroup` | `layout/InputGroup` |
| `overlays/Backdrop` | `overlays/BackdropOverlay` |
| `layout/Cluster` | `layout/ClusterLayout` |
| `layout/Box` | `layout/BoxLayout` |
| `layout/TwoColumn` | `layout/TwoColumnLayout` |
| `layout/Center` | `layout/CenterLayout` |
| `layout/AspectRatio` | `layout/AspectRatioLayout` |
| `layout/ControlGroup` | `forms/ControlGroupField` |
| `layout/Surface` | `layout/SurfaceLayout` |
| `layout/Frame` | `layout/FrameLayout` |
| `layout/Spacer` | `layout/SpacerLayout` |
| `layout/HStack` | `layout/HStackLayout` |
| `layout/Inline` | `layout/InlineLayout` |
| `layout/Container` | `layout/ContainerLayout` |
| `layout/ResizablePanels` | `layout/ResizablePanelsLayout` |
| `layout/Divider` | `layout/DividerLayout` |
| `layout/Stack` | `layout/StackLayout` |
| `layout/Overlay` | `layout/AnchorLayout` |
| `layout/Flex` | `layout/FlexLayout` |
| `layout/PullToRefresh` | `layout/PullToRefreshLayout` |
| `layout/VStack` | `layout/VStackLayout` |
| `feedback/Skeleton` | `feedback/SkeletonState` |
| `feedback/NotificationCenter` | `display/NotificationCenterGroup` |
| `feedback/Tour` | `overlays/TourPopover` |
| `feedback/OnboardingChecklist` | `display/OnboardingChecklistCard` |
| `feedback/ProgressSteps` | `feedback/ProgressStepsIndicator` |
| `feedback/LiveCursor` | `feedback/LiveCursorIndicator` |
| `feedback/ProgressCircle` | `feedback/ProgressCircleIndicator` |
| `actions/ToggleButtonGroup` | `forms/ToggleGroup` |
| `actions/OptionTileGroup` | `forms/OptionTileGroupField` |
| `actions/Fab` | `actions/FabButton` |
| `actions/ToggleButton` | `forms/ToggleInput` |
| `actions/OptionTile` | `forms/OptionTilePicker` |
| `actions/SpeedDial` | `actions/SpeedDialGroup` |
| `actions/Link` | `nav/LinkItem` |
| `actions/SegmentedControl` | `forms/SegmentedPicker` |
| `display/DataGrid` | `forms/DataGridEditor` |
| `display/ScrollReveal` | `display/ScrollRevealGroup` |
| `display/Tabs` | `display/TabsGroup` |
| `display/KeyboardShortcut` | `display/KeyboardShortcutText` |
| `display/Kbd` | `display/KbdText` |
| `display/Tree` | `display/TreeViewer` |
| `display/NotificationDot` | `display/NotificationIndicator` |
| `display/MessageList` | `display/MessageGroup` |
| `display/Tooltip` | `overlays/Tooltip` |
| `display/ChatBubble` | `display/ChatBubbleCard` |
| `display/SectionHeader` | `display/SectionHeading` |
| `display/Highlight` | `display/HighlightText` |
| `display/Quote` | `display/QuoteText` |
| `display/MetricChip` | `display/MetricBadge` |
| `display/Accordion` | `display/AccordionGroup` |
| `display/AnnotationMarker` | `display/AnnotationBadge` |
| `display/Separator` | `layout/SeparatorLayout` |
| `display/ActivityFeed` | `display/ActivityTimeline` |
| `display/DescriptionList` | `display/DescriptionGroup` |
| `display/Mark` | `display/MarkText` |
| `display/Code` | `display/CodeText` |
| `display/Snippet` | `display/SnippetText` |
| `display/NodeEditor` | `forms/NodeEditor` |
| `display/Marquee` | `display/MarqueeGroup` |
| `display/Image` | `display/ImagePreview` |
| `display/Gantt` | `display/GanttTimeline` |
| `display/CountUp` | `display/CountUpText` |
| `display/Stat` | `display/StatCard` |
| `display/AnimatedNumber` | `display/AnimatedNumberText` |
| `display/Confetti` | `display/ConfettiOverlay` |
| `display/Collapsible` | `display/CollapsibleGroup` |
| `display/List` | `display/ListGroup` |
| `display/CommentThread` | `display/CommentThreadGroup` |
| `display/MetaInline` | `display/MetaInlineText` |
| `display/Eyebrow` | `display/EyebrowText` |
| `display/Typewriter` | `display/TypewriterText` |
| `display/AudioWaveform` | `display/AudioWaveformPreview` |
| `display/HeatmapCalendar` | `display/HeatmapCalendarGrid` |
| `display/Tilt` | `layout/TiltLayout` |
| `display/SwipeActions` | `layout/SwipeActionsLayout` |
| `display/EventCalendar` | `display/EventCalendarViewer` |
| `display/Sortable` | `forms/SortableGroup` |
| `nav/CommandPalette` | `overlays/CommandPaletteModal` |

## Core optimization corrections

This batch corrects beta APIs without compatibility aliases. There are no production consumers.

| API | Current contract |
| --- | --- |
| `ExactNumber` instance methods | Methods use their receiver. Use `values.map(value => value.toString())`, not a detached method reference. Values remain frozen and comparisons/arithmetic remain exact. |
| `ExactNumber` transport | Native `structuredClone`, worker messages and IndexedDB structured cloning reject exact values. Use `LosslessJson` text to retain numeric tokens; ordinary JSON stringifies exact values as strings. |
| Generic value equality | Direct exact numeric values compare numerically. Shallow comparison of containing objects still compares their property values by identity. |
| `buildTree` | Each input produces one node. Duplicate IDs resolve children to the first matching owner; cycles are exposed as roots instead of recursing forever. |
| `mapTree` | Cyclic node graphs throw `TypeError`; arbitrarily deep acyclic trees use iterative traversal. |
| `maskString` visibility | Only nonnegative integer counts are valid. Invalid counts mask the whole string instead of exposing it. |
| `slugify` separator | A literal string, including empty strings and replacement/regex metacharacters. |
| `provideLocale` messages | A function is a translator value. Use a ref/computed for a changing translator; a getter returning another translator is not interpreted implicitly. |
| `QueryProvider.client` | Captured for the provider subtree lifetime. Remount the provider to switch clients. |
| `usePolling` | Accepts a direct callback or a ref holding one. Reactive indirection can use `usePolling(() => currentCallback.value())`. |
| `MaxBreakpoints` | Removed. Every entry in the supplied scale receives a listener. |
| Upload queue removal/clear | Abort requests immediately, but occupied slots remain until transports settle. Custom transports must honor their `AbortSignal`. |
| Form dirty state | Files/Blobs compare by identity; matching metadata does not establish matching bytes. |
| Theme enumeration | `ThemeCatalog` exposes lightweight declared metadata; `getTheme` generates only the requested candidate. Iterating `THEMES` still materializes all entries. |

The three legacy React apps received app-only corrections. The React library API is unchanged by this optimization batch.

## Verification

Run `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` and
`pnpm check:package --install`. The final command installs the actual packed package in a fresh consumer.
Use adjacent component specifications and the playground for current props, slots and behavior.
