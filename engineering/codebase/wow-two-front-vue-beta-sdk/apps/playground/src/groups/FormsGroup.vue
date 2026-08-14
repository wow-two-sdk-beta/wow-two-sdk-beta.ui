<script setup lang="ts">
import { ref } from 'vue';
import * as forms from '@wow-two-beta/ui-vue/presentation/forms';
import Demo from '../gallery/Demo.vue';
import Matrix from '../gallery/Matrix.vue';
import AutoGroup from '../gallery/AutoGroup.vue';

const {
  Label,
  Field,
  Fieldset,
  Legend,
  FormHelperText,
  FormErrorMessage,
  TextInput,
  TextAreaInput,
  EmailInput,
  TelInput,
  UrlInput,
  NumberInput,
  PasswordInput,
  SearchInput,
  Checkbox,
  Radio,
  Switch,
  Slider,
  CheckboxField,
  RadioField,
  SwitchField,
  CheckboxGroup,
  RadioGroup,
  PinInput,
  CharacterCount,
  InputAddon,
  InputGroup,
  LabeledInput,
  PasswordStrength,
  TagsInput,
  Listbox,
  ListboxItem,
  ListboxGroup,
  ListboxSeparator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectItem,
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxEmpty,
  Calendar,
  DatePicker,
  ColorSwatch,
  ColorSwatchPicker,
  Knob,
  Stepper,
  StepperList,
  StepperStep,
  StepperPanel,
  Wizard,
  WizardSteps,
  WizardStep,
  WizardFooter,
  Editable,
  EditablePreview,
  EditableInput,
  EditableSubmit,
  EditableCancel,
} = forms;

const covered = [
  'Label',
  'Field',
  'Fieldset',
  'Legend',
  'FormHelperText',
  'FormErrorMessage',
  'TextInput',
  'TextAreaInput',
  'EmailInput',
  'TelInput',
  'UrlInput',
  'NumberInput',
  'PasswordInput',
  'SearchInput',
  'Checkbox',
  'Radio',
  'Switch',
  'Slider',
  'CheckboxField',
  'RadioField',
  'SwitchField',
  'CheckboxGroup',
  'RadioGroup',
  'PinInput',
  'CharacterCount',
  'InputAddon',
  'InputGroup',
  'LabeledInput',
  'PasswordStrength',
  'TagsInput',
  'Listbox',
  'ListboxItem',
  'ListboxGroup',
  'ListboxSeparator',
  'Select',
  'SelectTrigger',
  'SelectValue',
  'SelectContent',
  'SelectItem',
  'MultiSelect',
  'MultiSelectTrigger',
  'MultiSelectContent',
  'MultiSelectItem',
  'Combobox',
  'ComboboxInput',
  'ComboboxContent',
  'ComboboxItem',
  'ComboboxEmpty',
  'Calendar',
  'DatePicker',
  'ColorSwatch',
  'ColorSwatchPicker',
  'Knob',
  'Stepper',
  'StepperList',
  'StepperStep',
  'StepperPanel',
  'Wizard',
  'WizardSteps',
  'WizardStep',
  'WizardFooter',
  'Editable',
  'EditablePreview',
  'EditableInput',
  'EditableSubmit',
  'EditableCancel',
];

const INPUT_SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const CHECKBOX_VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'glass', 'glass-surface'] as const;
const TONES = ['primary', 'neutral', 'danger', 'success', 'warning'] as const;
const BORDERS = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;

const text = ref('typed value');
const num = ref(42);
const switched = ref(true);
const slider = ref(40);
const pin = ref('12');
const tags = ref(['vue', 'tailwind']);
const selected = ref<string | null>('b');
const multi = ref<string[]>(['a']);
const combo = ref('');
const radioValue = ref('two');
const checkboxes = ref<string[]>(['a']);
const color = ref('#7c3aed');
const knob = ref(35);
const editable = ref('click to edit');
const listboxValue = ref<unknown>('b');
</script>

<template>
  <div class="space-y-6">
    <h2 class="font-mono text-sm font-bold uppercase tracking-wide">forms</h2>

    <Demo name="TextInput" note="size × state — invalid must be visibly different">
      <Matrix
        row-axis="size"
        col-axis="state"
        :rows="INPUT_SIZES"
        :cols="['default', 'invalid']"
      >
        <template #default="{ row, col }">
          <TextInput
            :size="row as never"
            :state="col as never"
            placeholder="placeholder"
            class="w-40"
          />
        </template>
      </Matrix>
    </Demo>

    <Demo name="TextInput" note="border × ring">
      <Matrix
        row-axis="border"
        col-axis="ring"
        :rows="BORDERS"
        :cols="['none', 'sm', 'md', 'lg']"
      >
        <template #default="{ row, col }">
          <TextInput :border="row as never" :ring="col as never" class="w-28" placeholder="Aa" />
        </template>
      </Matrix>
    </Demo>

    <Demo name="Checkbox" note="variant × tone, checked">
      <Matrix row-axis="variant" col-axis="tone" :rows="CHECKBOX_VARIANTS" :cols="TONES">
        <template #default="{ row, col }">
          <Checkbox :variant="row as never" :tone="col as never" :default-checked="true" />
        </template>
      </Matrix>
    </Demo>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-3">
      <Demo name="Text-ish inputs" note="every single-line input type, size md">
        <div class="space-y-2">
          <TextInput v-model="text" placeholder="TextInput" />
          <EmailInput placeholder="EmailInput" />
          <TelInput placeholder="TelInput" />
          <UrlInput placeholder="UrlInput" />
          <NumberInput v-model="num" />
          <PasswordInput placeholder="PasswordInput" has-toggle />
          <SearchInput placeholder="SearchInput" is-clearable />
          <TextAreaInput :rows="3" placeholder="TextAreaInput" />
        </div>
      </Demo>

      <Demo name="Checkbox / Radio / Switch" note="size axis + disabled + indeterminate">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <Checkbox v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s as never" default-checked />
            <Checkbox is-indeterminate />
            <Checkbox disabled />
            <Checkbox default-checked disabled />
          </div>
          <div class="flex items-center gap-3">
            <Radio v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s as never" default-checked />
            <Radio disabled />
          </div>
          <div class="flex items-center gap-3">
            <Switch v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s as never" default-checked />
            <Switch v-model="switched" />
            <Switch disabled />
          </div>
        </div>
      </Demo>

      <Demo name="Field" note="label / helper / error / required">
        <div class="space-y-3">
          <Field label="Email" helper="We never share it." is-required>
            <TextInput placeholder="you@example.com" />
          </Field>
          <Field label="Email" error="That address is already taken.">
            <TextInput state="invalid" placeholder="you@example.com" />
          </Field>
          <Field label="Disabled" is-disabled>
            <TextInput disabled placeholder="disabled" />
          </Field>
        </div>
      </Demo>

      <Demo name="Label / FormHelperText / FormErrorMessage / Fieldset / Legend">
        <Fieldset>
          <Legend>Contact</Legend>
          <Label is-required for="pg-name">Name</Label>
          <TextInput id="pg-name" placeholder="Ada" />
          <FormHelperText>Your full legal name.</FormHelperText>
          <FormErrorMessage message="Name is required." />
        </Fieldset>
      </Demo>

      <Demo name="Slider" note="size axis">
        <div class="space-y-3">
          <Slider v-for="s in ['sm', 'md', 'lg']" :key="s" v-model="slider" :size="s as never" />
          <p class="text-xs text-subtle-foreground">value = {{ slider }}</p>
        </div>
      </Demo>

      <Demo name="Knob" note="drag to rotate">
        <div class="flex items-center gap-4">
          <Knob v-model="knob" />
          <Knob :model-value="80" tone="success" />
          <Knob :model-value="15" tone="danger" />
          <span class="text-xs text-subtle-foreground">{{ knob }}</span>
        </div>
      </Demo>

      <Demo name="PinInput" note="numeric + masked">
        <div class="space-y-2">
          <PinInput v-model="pin" :length="4" />
          <PinInput :length="4" is-masked />
          <PinInput :length="4" type="alphanumeric" />
        </div>
      </Demo>

      <Demo name="CheckboxField / RadioField / SwitchField">
        <div class="space-y-2">
          <CheckboxField label="Ship weekly digest" description="Every Monday, 9am." />
          <RadioField label="Standard delivery" description="3–5 business days." />
          <SwitchField label="Dark mode" description="Follows the theme toggle." />
        </div>
      </Demo>

      <Demo name="CheckboxGroup / RadioGroup" note="horizontal + vertical">
        <div class="space-y-3">
          <CheckboxGroup v-model="checkboxes" legend="Toppings">
            <CheckboxField value="a" label="Cheese" />
            <CheckboxField value="b" label="Basil" />
          </CheckboxGroup>
          <RadioGroup v-model="radioValue" legend="Plan" name="pg-plan" orientation="horizontal">
            <RadioField value="one" label="Free" />
            <RadioField value="two" label="Pro" />
          </RadioGroup>
          <p class="text-xs text-subtle-foreground">{{ checkboxes }} / {{ radioValue }}</p>
        </div>
      </Demo>

      <Demo name="InputGroup / InputAddon / LabeledInput">
        <div class="space-y-2">
          <InputGroup>
            <InputAddon leading="https://" />
            <TextInput placeholder="example.com" />
            <InputAddon trailing=".io" />
          </InputGroup>
          <LabeledInput label="Amount" trailing="USD">
            <TextInput placeholder="0.00" />
          </LabeledInput>
        </div>
      </Demo>

      <Demo name="CharacterCount / PasswordStrength">
        <div class="space-y-3">
          <CharacterCount :value="42" :max="120" is-max-shown />
          <CharacterCount :value="130" :max="120" />
          <PasswordStrength value="hunter2" :score="1" />
          <PasswordStrength value="c0rrect-h0rse-battery" :score="4" />
        </div>
      </Demo>

      <Demo name="TagsInput">
        <TagsInput v-model="tags" placeholder="Add a tag…" />
        <p class="mt-1 text-xs text-subtle-foreground">{{ tags }}</p>
      </Demo>

      <Demo name="Listbox" note="groups, separators, selection indicator">
        <Listbox v-model="listboxValue" class="w-56">
          <ListboxGroup label="Fruit">
            <ListboxItem value="a">Apple</ListboxItem>
            <ListboxItem value="b">Banana</ListboxItem>
          </ListboxGroup>
          <ListboxSeparator />
          <ListboxGroup label="Veg">
            <ListboxItem value="c">Carrot</ListboxItem>
            <ListboxItem value="d" is-disabled>Disabled</ListboxItem>
          </ListboxGroup>
        </Listbox>
      </Demo>

      <!-- The trigger shows the RAW KEY until the content has mounted once: `SelectValue`
           resolves label → item registry → captured label → cache → `getOptionLabel` →
           `serializeKey`. With a preset value and a never-opened menu only the last step
           can fire, so pass `getOptionLabel` (or `options`) to label a closed trigger. -->
      <Demo name="Select" note="preset value, menu never opened — shows the raw key 'b'">
        <Select v-model="selected">
          <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
          <SelectContent>
            <SelectItem :item-key="'a'" label="Alpha" />
            <SelectItem :item-key="'b'" label="Beta" />
            <SelectItem :item-key="'c'" label="Gamma" is-disabled />
          </SelectContent>
        </Select>
        <p class="mt-1 text-xs text-subtle-foreground">value = {{ selected }}</p>

        <p class="mt-3 mb-1 text-xs text-subtle-foreground">same, with `getOptionLabel`:</p>
        <Select
          v-model="selected"
          :get-option-label="(k) => ({ a: 'Alpha', b: 'Beta', c: 'Gamma' })[k as string] ?? null"
        >
          <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
          <SelectContent>
            <SelectItem :item-key="'a'" label="Alpha" />
            <SelectItem :item-key="'b'" label="Beta" />
          </SelectContent>
        </Select>
      </Demo>

      <Demo name="Select" note="size axis on the trigger">
        <div class="space-y-2">
          <Select v-for="s in INPUT_SIZES" :key="s">
            <SelectTrigger :size="s"><SelectValue :placeholder="`size ${s}`" /></SelectTrigger>
            <SelectContent><SelectItem :item-key="'x'" label="Item" /></SelectContent>
          </Select>
        </div>
      </Demo>

      <Demo name="MultiSelect" note="selected values render as tags in the trigger">
        <MultiSelect v-model="multi">
          <MultiSelectTrigger />
          <MultiSelectContent>
            <MultiSelectItem value="a">Alpha</MultiSelectItem>
            <MultiSelectItem value="b">Beta</MultiSelectItem>
            <MultiSelectItem value="c">Gamma</MultiSelectItem>
          </MultiSelectContent>
        </MultiSelect>
        <p class="mt-1 text-xs text-subtle-foreground">{{ multi }}</p>
      </Demo>

      <Demo name="Combobox" note="type to filter">
        <Combobox v-model="combo">
          <ComboboxInput placeholder="Search fruit…" />
          <ComboboxContent>
            <ComboboxItem value="apple" label="Apple" />
            <ComboboxItem value="banana" label="Banana" />
            <ComboboxItem value="cherry" label="Cherry" />
            <ComboboxEmpty>No matches.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </Demo>

      <Demo name="Calendar" note="Temporal-backed month grid">
        <Calendar />
      </Demo>

      <Demo name="DatePicker" note="click to open the calendar popover">
        <DatePicker placeholder="Pick a date" />
      </Demo>

      <Demo name="ColorSwatch / ColorSwatchPicker" note="size × shape">
        <div class="space-y-3">
          <Matrix
            row-axis="size"
            col-axis="shape"
            :rows="['xs', 'sm', 'md', 'lg']"
            :cols="['square', 'circle']"
          >
            <template #default="{ row, col }">
              <ColorSwatch color="#7c3aed" :size="row as never" :shape="col as never" />
            </template>
          </Matrix>
          <ColorSwatchPicker
            v-model="color"
            :colors="['#7c3aed', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444']"
          />
          <p class="text-xs text-subtle-foreground">{{ color }}</p>
        </div>
      </Demo>

      <Demo name="Stepper" note="step statuses pending / active / complete">
        <Stepper default-value="profile">
          <StepperList>
            <StepperStep value="account">Account</StepperStep>
            <StepperStep value="profile">Profile</StepperStep>
            <StepperStep value="done" is-disabled>Done</StepperStep>
          </StepperList>
          <StepperPanel value="account"><p class="p-2 text-sm">Account panel</p></StepperPanel>
          <StepperPanel value="profile"><p class="p-2 text-sm">Profile panel</p></StepperPanel>
        </Stepper>
      </Demo>

      <!-- `WizardSteps` renders the tablist from the CONTEXT REGISTRY and has no slot;
           the `WizardStep` panels are its SIBLINGS, not its children. Nesting them inside
           `WizardSteps` renders an empty tablist and no panels. -->
      <Demo name="Wizard" note="steps register from sibling panels, not from WizardSteps' slot">
        <Wizard default-current-step="one">
          <WizardSteps />
          <WizardStep id="one" label="One"><p class="text-sm">Panel one</p></WizardStep>
          <WizardStep id="two" label="Two" is-final><p class="text-sm">Panel two</p></WizardStep>
          <WizardFooter />
        </Wizard>
      </Demo>

      <Demo name="Editable" note="click the preview to enter edit mode">
        <Editable v-model="editable">
          <EditablePreview />
          <EditableInput />
          <EditableSubmit>Save</EditableSubmit>
          <EditableCancel>Cancel</EditableCancel>
        </Editable>
      </Demo>
    </div>

    <h3 class="border-t border-border pt-4 font-mono text-xs uppercase text-subtle-foreground">
      auto-mounted tail
    </h3>
    <AutoGroup :namespace="forms" :covered="covered" />
  </div>
</template>
