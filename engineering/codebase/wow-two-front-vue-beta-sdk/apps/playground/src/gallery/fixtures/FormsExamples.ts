import { h, type VNode } from 'vue';
import {
  AddressEditor,
  CalendarPicker,
  ChatComposerInput,
  CheckboxInput,
  CheckboxField,
  CheckboxGroup,
  ChoiceCard,
  CodeEditor,
  ColorArea,
  ColorInput,
  ColorPicker,
  ColorSliderInput,
  ColorSwatchPicker,
  ColorWheelInput,
  ComboboxPicker,
  ComboboxPickerContent,
  ComboboxPickerEmpty,
  ComboboxPickerGroup,
  ComboboxPickerInput,
  ComboboxPickerItem,
  ComboboxPickerSeparator,
  CronInput,
  CurrencyInput,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateTimeInput,
  EditableInput,
  EditableInputCancel,
  EditableInputInput,
  EditableInputPreview,
  EditableInputSubmit,
  EmailInput,
  EmojiPicker,
  EmojiPickerPopover,
  EmojiSizePicker,
  Field,
  FilePicker,
  FileUploadPicker,
  FontPicker,
  FormField,
  GradientPicker,
  IconPicker,
  JsonEditor,
  KeyboardShortcutPicker,
  KnobInput,
  LabeledField,
  ListboxPicker,
  ListboxPickerEmpty,
  ListboxPickerGroup,
  ListboxPickerItem,
  ListboxPickerSeparator,
  MarkdownEditor,
  MaskedInput,
  MultiSelectPicker,
  MultiSelectPickerContent,
  MultiSelectPickerItem,
  MultiSelectPickerTags,
  MultiSelectPickerTrigger,
  NumberInput,
  PasswordInput,
  PercentInput,
  PhoneInput,
  PinInput,
  RadioInput,
  RadioField,
  RadioGroup,
  RangeCalendarPicker,
  ReactionPicker,
  RecurrenceEditor,
  SearchInput,
  SelectPicker,
  SelectPickerContent,
  SelectPickerItem,
  SelectPickerTrigger,
  SelectPickerValue,
  SliderInput,
  SwitchInput,
  SwitchField,
  TagsInput,
  TelInput,
  TextAreaInput,
  TextInput,
  TimeInput,
  TimePicker,
  UrlInput,
  WizardForm,
  WizardFormFooter,
  WizardFormStep,
  WizardFormSteps,
} from '../../../../../src/presentation/forms';
import {
  CharacterCountCallout,
  FieldErrorCallout,
  PasswordStrengthCallout,
} from '../../../../../src/presentation/feedback';
import {
  ColorSwatchPreview,
  FieldHelperText,
  LabelText,
  LegendText,
  StepperGroup,
  StepperGroupList,
  StepperGroupPanel,
  StepperGroupStep,
} from '../../../../../src/presentation/display';
import { FieldsetLayout, InputAddonLayout, InputGroup } from '../../../../../src/presentation/layout';
import { memoryStorageBroker } from '../../../../../src/foundation/storage';
import { smokeCase, type SmokeCase } from './Example';

/* Wrappers for the compound parts — each renders the part inside the root whose `provide` it
   injects. Every root is opened through its UNCONTROLLED path (`defaultOpen` / `defaultEditing`
   / `defaultValue`), never by passing `open`, which doubles as the guard for the port's
   `boolean` cast bug: Vue coerces an absent `boolean` prop to `false` unless the declaration
   owns an explicit `undefined` default, and a root that got that wrong reads as
   controlled-and-closed, so every part below it would render nothing. */
const inListbox = (node: VNode): VNode => h(ListboxPicker, null, () => node);

/* SelectPicker declares a required `default` slot, so its children go in as a slots object — the
   bare-function children form does not satisfy that. Every root below declares one too. */
const inSelect = (node: VNode): VNode => h(SelectPicker, { defaultOpen: true }, { default: () => node });
const inSelectTrigger = (node: VNode): VNode => inSelect(h(SelectPickerTrigger, null, () => node));
const inSelectContent = (node: VNode): VNode => inSelect(h(SelectPickerContent, null, () => node));

/* MultiSelectPicker hosts a `Popover`, so its parts need the popover context as well as its own —
   wrapping is what supplies both. `MultiSelectPickerItem` renders a `ListboxPickerItem`, whose ListboxPicker
   lives inside `MultiSelectPickerContent`, so it nests one level deeper. */
const inMultiSelect = (node: VNode): VNode => h(MultiSelectPicker, { defaultOpen: true }, { default: () => node });
const inMultiSelectContent = (node: VNode): VNode =>
  inMultiSelect(h(MultiSelectPickerContent, null, { default: () => node }));

const inCombobox = (node: VNode): VNode => h(ComboboxPicker, { defaultOpen: true }, { default: () => node });
const inComboboxContent = (node: VNode): VNode => inCombobox(h(ComboboxPickerContent, null, { default: () => node }));

/* `StepperGroupPanel` renders its slot only while the stepper's value matches its own, so the root
   is seeded with the value the cases below declare. `StepperGroupStep` additionally reads the
   roving-focus context that `StepperGroupList` owns. */
const inStepper = (node: VNode): VNode => h(StepperGroup, { defaultValue: 'one' }, { default: () => node });
const inStepperList = (node: VNode): VNode => inStepper(h(StepperGroupList, null, { default: () => node }));

/* `WizardForm` seeds its active step from the first one that registers, so a lone `WizardFormStep`
   is the current step and renders its panel. */
const inWizard = (node: VNode): VNode => h(WizardForm, null, { default: () => node });

/* `EditableInput` swaps between two halves of its tree: the preview renders while idle, the input
   and the two commit buttons only while editing. Each part gets the root in the state that
   actually renders it. */
const inEditable = (node: VNode): VNode => h(EditableInput, null, { default: () => node });
const inEditingEditable = (node: VNode): VNode => h(EditableInput, { defaultEditing: true }, { default: () => node });

/**
 * Every component `@wow-two-beta/ui-vue/presentation/forms` exports, as smoke cases.
 * Imported through the public barrel on purpose — a component missing from `index.ts` fails
 * here before a consumer finds it.
 *
 * Order mirrors `src/presentation/forms/index.ts`, so a folder added to the barrel has an
 * obvious insertion point here and a gap is visible by reading the two side by side.
 */
export const formsExamples: readonly SmokeCase[] = [
  smokeCase('LabelText', LabelText, {}, { slot: true }),
  smokeCase('FieldHelperText', FieldHelperText, {}, { slot: true }),
  smokeCase('FieldErrorCallout', FieldErrorCallout, {}, { slot: true }),
  smokeCase('FieldsetLayout', FieldsetLayout, {}, { slot: true }),
  smokeCase('LegendText', LegendText, {}, { slot: true }),
  smokeCase('TextInput', TextInput, {}),
  smokeCase('EmailInput', EmailInput, {}),
  smokeCase('TelInput', TelInput, {}),
  smokeCase('UrlInput', UrlInput, {}),
  smokeCase('NumberInput', NumberInput, {}),
  smokeCase('PasswordInput', PasswordInput, {}),
  smokeCase('SearchInput', SearchInput, {}),
  smokeCase('TextAreaInput', TextAreaInput, {}),
  smokeCase('CheckboxInput', CheckboxInput, {}),
  smokeCase('RadioInput', RadioInput, {}),
  smokeCase('SwitchInput', SwitchInput, {}),
  smokeCase('SliderInput', SliderInput, {}),
  smokeCase('Field', Field, {}, { slot: true }),
  smokeCase('FormField', FormField, {}, { slot: true }),
  smokeCase('CheckboxField', CheckboxField, {}),
  smokeCase('RadioField', RadioField, {}),
  smokeCase('SwitchField', SwitchField, {}),
  smokeCase('CheckboxGroup', CheckboxGroup, {}, { slot: true }),
  smokeCase('RadioGroup', RadioGroup, {}, { slot: true }),
  smokeCase('PinInput', PinInput, {}),
  smokeCase('MaskedInput', MaskedInput, { mask: '999-999' }),
  smokeCase('CurrencyInput', CurrencyInput, {}),
  smokeCase('PercentInput', PercentInput, {}),
  smokeCase('CharacterCountCallout', CharacterCountCallout, { value: 3, max: 10 }),
  smokeCase('InputAddonLayout', InputAddonLayout, {}, { slot: true }),
  smokeCase('InputGroup', InputGroup, {}, { slot: true }),
  smokeCase('LabeledField', LabeledField, {}, { slot: true }),
  smokeCase('ChoiceCard', ChoiceCard, {}),
  smokeCase('PasswordStrengthCallout', PasswordStrengthCallout, { value: 'hunter2' }),
  smokeCase('FilePicker', FilePicker, {}),
  smokeCase('ListboxPicker', ListboxPicker, {}, { slot: true }),
  smokeCase('ListboxPickerItem', ListboxPickerItem, { value: 'one' }, { slot: true, wrap: inListbox }),
  smokeCase('ListboxPickerGroup', ListboxPickerGroup, {}, { slot: true, wrap: inListbox }),
  smokeCase('ListboxPickerSeparator', ListboxPickerSeparator, {}, { wrap: inListbox }),
  smokeCase('ListboxPickerEmpty', ListboxPickerEmpty, {}, { slot: true, wrap: inListbox }),
  smokeCase('SelectPicker', SelectPicker, {}, { slot: true }),
  smokeCase('SelectPickerTrigger', SelectPickerTrigger, {}, { slot: true, wrap: inSelect }),
  smokeCase('SelectPickerValue', SelectPickerValue, {}, { slot: true, wrap: inSelectTrigger }),
  smokeCase('SelectPickerContent', SelectPickerContent, {}, { slot: true, wrap: inSelect }),
  smokeCase(
    'SelectPickerItem',
    SelectPickerItem,
    { itemKey: 'one', label: 'One' },
    { slot: true, wrap: inSelectContent },
  ),
  smokeCase('MultiSelectPicker', MultiSelectPicker, {}, { slot: true }),
  smokeCase('MultiSelectPickerTrigger', MultiSelectPickerTrigger, {}, { slot: true, wrap: inMultiSelect }),
  // Its only slot is `placeholder`; the tags themselves come from the root's value.
  smokeCase('MultiSelectPickerTags', MultiSelectPickerTags, {}, { wrap: inMultiSelect }),
  smokeCase('MultiSelectPickerContent', MultiSelectPickerContent, {}, { slot: true, wrap: inMultiSelect }),
  smokeCase(
    'MultiSelectPickerItem',
    MultiSelectPickerItem,
    { value: 'one' },
    { slot: true, wrap: inMultiSelectContent },
  ),
  smokeCase('ComboboxPicker', ComboboxPicker, {}, { slot: true }),
  // Renders a bare `<input>` — no slot to probe.
  smokeCase('ComboboxPickerInput', ComboboxPickerInput, {}, { wrap: inCombobox }),
  smokeCase('ComboboxPickerContent', ComboboxPickerContent, {}, { slot: true, wrap: inCombobox }),
  smokeCase('ComboboxPickerItem', ComboboxPickerItem, { value: 'one' }, { slot: true, wrap: inComboboxContent }),
  smokeCase('ComboboxPickerGroup', ComboboxPickerGroup, {}, { slot: true, wrap: inComboboxContent }),
  smokeCase('ComboboxPickerSeparator', ComboboxPickerSeparator, {}, { wrap: inComboboxContent }),
  smokeCase('ComboboxPickerEmpty', ComboboxPickerEmpty, {}, { slot: true, wrap: inComboboxContent }),
  smokeCase('CalendarPicker', CalendarPicker, {}),
  smokeCase('DateInput', DateInput, {}),
  smokeCase('DateTimeInput', DateTimeInput, {}),
  smokeCase('TimeInput', TimeInput, {}),
  smokeCase('RangeCalendarPicker', RangeCalendarPicker, {}),
  smokeCase('DatePicker', DatePicker, {}),
  smokeCase('TimePicker', TimePicker, {}),
  smokeCase('DateRangePicker', DateRangePicker, {}),
  smokeCase('ColorSwatchPreview', ColorSwatchPreview, {}),
  smokeCase('ColorInput', ColorInput, {}),
  smokeCase('ColorSliderInput', ColorSliderInput, {}),
  smokeCase('ColorArea', ColorArea, {}),
  smokeCase('ColorWheelInput', ColorWheelInput, {}),
  smokeCase('ColorSwatchPicker', ColorSwatchPicker, { colors: ['#ff0000', '#00ff00'] }),
  smokeCase('ColorPicker', ColorPicker, {}),
  smokeCase('StepperGroup', StepperGroup, {}, { slot: true }),
  smokeCase('StepperGroupList', StepperGroupList, {}, { slot: true, wrap: inStepper }),
  smokeCase('StepperGroupStep', StepperGroupStep, { value: 'one' }, { slot: true, wrap: inStepperList }),
  smokeCase('StepperGroupPanel', StepperGroupPanel, { value: 'one' }, { slot: true, wrap: inStepper }),
  smokeCase('TagsInput', TagsInput, {}),
  smokeCase('FileUploadPicker', FileUploadPicker, {}, { slot: true }),
  smokeCase('EditableInput', EditableInput, {}, { slot: true }),
  // The preview renders the committed value as text and takes no slot; it is also the half
  // that renders while idle, so it gets the root in its default state.
  smokeCase('EditableInputPreview', EditableInputPreview, {}, { wrap: inEditable }),
  smokeCase('EditableInputInput', EditableInputInput, {}, { wrap: inEditingEditable }),
  smokeCase('EditableInputSubmit', EditableInputSubmit, {}, { slot: true, wrap: inEditingEditable }),
  smokeCase('EditableInputCancel', EditableInputCancel, {}, { slot: true, wrap: inEditingEditable }),
  smokeCase('WizardForm', WizardForm, {}, { slot: true }),
  // The strip renders one tab per registered step; the footer renders its two buttons. Both
  // take only named slots.
  smokeCase('WizardFormSteps', WizardFormSteps, {}, { wrap: inWizard }),
  smokeCase('WizardFormStep', WizardFormStep, { id: 'one' }, { slot: true, wrap: inWizard }),
  smokeCase('WizardFormFooter', WizardFormFooter, {}, { wrap: inWizard }),
  smokeCase('CodeEditor', CodeEditor, {}),
  smokeCase('MarkdownEditor', MarkdownEditor, {}),
  smokeCase('JsonEditor', JsonEditor, {}),
  smokeCase('RecurrenceEditor', RecurrenceEditor, {}),
  smokeCase('KnobInput', KnobInput, {}),
  smokeCase('KeyboardShortcutPicker', KeyboardShortcutPicker, {}),
  smokeCase('IconPicker', IconPicker, {}),
  smokeCase('FontPicker', FontPicker, {}),
  smokeCase('CronInput', CronInput, {}),
  smokeCase('GradientPicker', GradientPicker, {}),
  smokeCase('AddressEditor', AddressEditor, {}),
  smokeCase('PhoneInput', PhoneInput, {}),
  smokeCase('EmojiPicker', EmojiPicker, { storage: memoryStorageBroker() }),
  smokeCase('EmojiPickerPopover', EmojiPickerPopover, { storage: memoryStorageBroker() }),
  smokeCase('EmojiSizePicker', EmojiSizePicker, { glyph: '\u{1F600}' }),
  smokeCase('ReactionPicker', ReactionPicker, {}),
  smokeCase('ChatComposerInput', ChatComposerInput, {}),
];
