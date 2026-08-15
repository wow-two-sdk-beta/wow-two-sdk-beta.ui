import { h, type VNode } from 'vue';
import {
  AddressForm,
  Calendar,
  CharacterCount,
  ChatComposer,
  Checkbox,
  CheckboxField,
  CheckboxGroup,
  ChoiceCard,
  CodeEditor,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ColorWheel,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxSeparator,
  CronInput,
  CurrencyInput,
  DateField,
  DatePicker,
  DateRangePicker,
  DateTimeField,
  Editable,
  EditableCancel,
  EditableInput,
  EditablePreview,
  EditableSubmit,
  EmailInput,
  EmojiPicker,
  EmojiPickerPopover,
  EmojiSizeControl,
  Field,
  Fieldset,
  FilePicker,
  FileUpload,
  FontPicker,
  FormErrorMessage,
  FormField,
  FormHelperText,
  GradientPicker,
  IconPicker,
  InputAddon,
  InputGroup,
  JSONEditor,
  KeyboardShortcutPicker,
  Knob,
  Label,
  LabeledInput,
  Legend,
  Listbox,
  ListboxEmpty,
  ListboxGroup,
  ListboxItem,
  ListboxSeparator,
  MarkdownEditor,
  MaskedInput,
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTags,
  MultiSelectTrigger,
  NumberInput,
  PasswordInput,
  PasswordStrength,
  PercentInput,
  PhoneInput,
  PinInput,
  Radio,
  RadioField,
  RadioGroup,
  RangeCalendar,
  ReactionPicker,
  RecurrenceEditor,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Stepper,
  StepperList,
  StepperPanel,
  StepperStep,
  Switch,
  SwitchField,
  TagsInput,
  TelInput,
  TextAreaInput,
  TextInput,
  TimeField,
  TimePicker,
  UrlInput,
  Wizard,
  WizardFooter,
  WizardStep,
  WizardSteps,
} from '@src/presentation/forms';
import { memoryStorageBroker } from '@src/foundation/storage';
import { smokeCase, type SmokeCase } from '../../../support/Smoke';

/* Wrappers for the compound parts — each renders the part inside the root whose `provide` it
   injects. Every root is opened through its UNCONTROLLED path (`defaultOpen` / `defaultEditing`
   / `defaultValue`), never by passing `isOpen`, which doubles as the guard for the port's
   `boolean` cast bug: Vue coerces an absent `boolean` prop to `false` unless the declaration
   owns an explicit `undefined` default, and a root that got that wrong reads as
   controlled-and-closed, so every part below it would render nothing. */
const inListbox = (node: VNode): VNode => h(Listbox, null, () => node);

/* Select declares a required `default` slot, so its children go in as a slots object — the
   bare-function children form does not satisfy that. Every root below declares one too. */
const inSelect = (node: VNode): VNode => h(Select, { defaultOpen: true }, { default: () => node });
const inSelectTrigger = (node: VNode): VNode => inSelect(h(SelectTrigger, null, () => node));
const inSelectContent = (node: VNode): VNode => inSelect(h(SelectContent, null, () => node));

/* MultiSelect hosts a `Popover`, so its parts need the popover context as well as its own —
   wrapping is what supplies both. `MultiSelectItem` renders a `ListboxItem`, whose Listbox
   lives inside `MultiSelectContent`, so it nests one level deeper. */
const inMultiSelect = (node: VNode): VNode => h(MultiSelect, { defaultOpen: true }, { default: () => node });
const inMultiSelectContent = (node: VNode): VNode =>
  inMultiSelect(h(MultiSelectContent, null, { default: () => node }));

const inCombobox = (node: VNode): VNode => h(Combobox, { defaultOpen: true }, { default: () => node });
const inComboboxContent = (node: VNode): VNode => inCombobox(h(ComboboxContent, null, { default: () => node }));

/* `StepperPanel` renders its slot only while the stepper's value matches its own, so the root
   is seeded with the value the cases below declare. `StepperStep` additionally reads the
   roving-focus context that `StepperList` owns. */
const inStepper = (node: VNode): VNode => h(Stepper, { defaultValue: 'one' }, { default: () => node });
const inStepperList = (node: VNode): VNode => inStepper(h(StepperList, null, { default: () => node }));

/* `Wizard` seeds its active step from the first one that registers, so a lone `WizardStep`
   is the current step and renders its panel. */
const inWizard = (node: VNode): VNode => h(Wizard, null, { default: () => node });

/* `Editable` swaps between two halves of its tree: the preview renders while idle, the input
   and the two commit buttons only while editing. Each part gets the root in the state that
   actually renders it. */
const inEditable = (node: VNode): VNode => h(Editable, null, { default: () => node });
const inEditingEditable = (node: VNode): VNode => h(Editable, { defaultEditing: true }, { default: () => node });

/**
 * Every component `@wow-two-beta/ui-vue/presentation/forms` exports, as smoke cases.
 * Imported through the public barrel on purpose — a component missing from `index.ts` fails
 * here before a consumer finds it.
 *
 * Order mirrors `src/presentation/forms/index.ts`, so a folder added to the barrel has an
 * obvious insertion point here and a gap is visible by reading the two side by side.
 */
export const formsCases: readonly SmokeCase[] = [
  smokeCase('Label', Label, {}, { slot: true }),
  smokeCase('FormHelperText', FormHelperText, {}, { slot: true }),
  smokeCase('FormErrorMessage', FormErrorMessage, {}, { slot: true }),
  smokeCase('Fieldset', Fieldset, {}, { slot: true }),
  smokeCase('Legend', Legend, {}, { slot: true }),
  smokeCase('TextInput', TextInput, {}),
  smokeCase('EmailInput', EmailInput, {}),
  smokeCase('TelInput', TelInput, {}),
  smokeCase('UrlInput', UrlInput, {}),
  smokeCase('NumberInput', NumberInput, {}),
  smokeCase('PasswordInput', PasswordInput, {}),
  smokeCase('SearchInput', SearchInput, {}),
  smokeCase('TextAreaInput', TextAreaInput, {}),
  smokeCase('Checkbox', Checkbox, {}),
  smokeCase('Radio', Radio, {}),
  smokeCase('Switch', Switch, {}),
  smokeCase('Slider', Slider, {}),
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
  smokeCase('CharacterCount', CharacterCount, { value: 3, max: 10 }),
  smokeCase('InputAddon', InputAddon, {}, { slot: true }),
  smokeCase('InputGroup', InputGroup, {}, { slot: true }),
  smokeCase('LabeledInput', LabeledInput, {}, { slot: true }),
  smokeCase('ChoiceCard', ChoiceCard, {}),
  smokeCase('PasswordStrength', PasswordStrength, { value: 'hunter2' }),
  smokeCase('FilePicker', FilePicker, {}),
  smokeCase('Listbox', Listbox, {}, { slot: true }),
  smokeCase('ListboxItem', ListboxItem, { value: 'one' }, { slot: true, wrap: inListbox }),
  smokeCase('ListboxGroup', ListboxGroup, {}, { slot: true, wrap: inListbox }),
  smokeCase('ListboxSeparator', ListboxSeparator, {}, { wrap: inListbox }),
  smokeCase('ListboxEmpty', ListboxEmpty, {}, { slot: true, wrap: inListbox }),
  smokeCase('Select', Select, {}, { slot: true }),
  smokeCase('SelectTrigger', SelectTrigger, {}, { slot: true, wrap: inSelect }),
  smokeCase('SelectValue', SelectValue, {}, { slot: true, wrap: inSelectTrigger }),
  smokeCase('SelectContent', SelectContent, {}, { slot: true, wrap: inSelect }),
  smokeCase('SelectItem', SelectItem, { itemKey: 'one', label: 'One' }, { slot: true, wrap: inSelectContent }),
  smokeCase('MultiSelect', MultiSelect, {}, { slot: true }),
  smokeCase('MultiSelectTrigger', MultiSelectTrigger, {}, { slot: true, wrap: inMultiSelect }),
  // Its only slot is `placeholder`; the tags themselves come from the root's value.
  smokeCase('MultiSelectTags', MultiSelectTags, {}, { wrap: inMultiSelect }),
  smokeCase('MultiSelectContent', MultiSelectContent, {}, { slot: true, wrap: inMultiSelect }),
  smokeCase('MultiSelectItem', MultiSelectItem, { value: 'one' }, { slot: true, wrap: inMultiSelectContent }),
  smokeCase('Combobox', Combobox, {}, { slot: true }),
  // Renders a bare `<input>` — no slot to probe.
  smokeCase('ComboboxInput', ComboboxInput, {}, { wrap: inCombobox }),
  smokeCase('ComboboxContent', ComboboxContent, {}, { slot: true, wrap: inCombobox }),
  smokeCase('ComboboxItem', ComboboxItem, { value: 'one' }, { slot: true, wrap: inComboboxContent }),
  smokeCase('ComboboxGroup', ComboboxGroup, {}, { slot: true, wrap: inComboboxContent }),
  smokeCase('ComboboxSeparator', ComboboxSeparator, {}, { wrap: inComboboxContent }),
  smokeCase('ComboboxEmpty', ComboboxEmpty, {}, { slot: true, wrap: inComboboxContent }),
  smokeCase('Calendar', Calendar, {}),
  smokeCase('DateField', DateField, {}),
  smokeCase('DateTimeField', DateTimeField, {}),
  smokeCase('TimeField', TimeField, {}),
  smokeCase('RangeCalendar', RangeCalendar, {}),
  smokeCase('DatePicker', DatePicker, {}),
  smokeCase('TimePicker', TimePicker, {}),
  smokeCase('DateRangePicker', DateRangePicker, {}),
  smokeCase('ColorSwatch', ColorSwatch, {}),
  smokeCase('ColorField', ColorField, {}),
  smokeCase('ColorSlider', ColorSlider, {}),
  smokeCase('ColorArea', ColorArea, {}),
  smokeCase('ColorWheel', ColorWheel, {}),
  smokeCase('ColorSwatchPicker', ColorSwatchPicker, { colors: ['#ff0000', '#00ff00'] }),
  smokeCase('ColorPicker', ColorPicker, {}),
  smokeCase('Stepper', Stepper, {}, { slot: true }),
  smokeCase('StepperList', StepperList, {}, { slot: true, wrap: inStepper }),
  smokeCase('StepperStep', StepperStep, { value: 'one' }, { slot: true, wrap: inStepperList }),
  smokeCase('StepperPanel', StepperPanel, { value: 'one' }, { slot: true, wrap: inStepper }),
  smokeCase('TagsInput', TagsInput, {}),
  smokeCase('FileUpload', FileUpload, {}, { slot: true }),
  smokeCase('Editable', Editable, {}, { slot: true }),
  // The preview renders the committed value as text and takes no slot; it is also the half
  // that renders while idle, so it gets the root in its default state.
  smokeCase('EditablePreview', EditablePreview, {}, { wrap: inEditable }),
  smokeCase('EditableInput', EditableInput, {}, { wrap: inEditingEditable }),
  smokeCase('EditableSubmit', EditableSubmit, {}, { slot: true, wrap: inEditingEditable }),
  smokeCase('EditableCancel', EditableCancel, {}, { slot: true, wrap: inEditingEditable }),
  smokeCase('Wizard', Wizard, {}, { slot: true }),
  // The strip renders one tab per registered step; the footer renders its two buttons. Both
  // take only named slots.
  smokeCase('WizardSteps', WizardSteps, {}, { wrap: inWizard }),
  smokeCase('WizardStep', WizardStep, { id: 'one' }, { slot: true, wrap: inWizard }),
  smokeCase('WizardFooter', WizardFooter, {}, { wrap: inWizard }),
  smokeCase('CodeEditor', CodeEditor, {}),
  smokeCase('MarkdownEditor', MarkdownEditor, {}),
  smokeCase('JSONEditor', JSONEditor, {}),
  smokeCase('RecurrenceEditor', RecurrenceEditor, {}),
  smokeCase('Knob', Knob, {}),
  smokeCase('KeyboardShortcutPicker', KeyboardShortcutPicker, {}),
  smokeCase('IconPicker', IconPicker, {}),
  smokeCase('FontPicker', FontPicker, {}),
  smokeCase('CronInput', CronInput, {}),
  smokeCase('GradientPicker', GradientPicker, {}),
  smokeCase('AddressForm', AddressForm, {}),
  smokeCase('PhoneInput', PhoneInput, {}),
  smokeCase('EmojiPicker', EmojiPicker, { storage: memoryStorageBroker() }),
  smokeCase('EmojiPickerPopover', EmojiPickerPopover, { storage: memoryStorageBroker() }),
  smokeCase('EmojiSizeControl', EmojiSizeControl, { glyph: '\u{1F600}' }),
  smokeCase('ReactionPicker', ReactionPicker, {}),
  smokeCase('ChatComposer', ChatComposer, {}),
];
