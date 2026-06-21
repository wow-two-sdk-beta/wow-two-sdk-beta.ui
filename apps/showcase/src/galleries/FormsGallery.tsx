import { useState, type ReactNode } from 'react';
import { SectionHeader } from '@wow-two-beta/ui/display';
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
  ComboboxInput,
  ComboboxItem,
  CronInput,
  CurrencyInput,
  DateField,
  DatePicker,
  DateRangePicker,
  Editable,
  EditableCancel,
  EditableInput,
  EditablePreview,
  EditableSubmit,
  EmailInput,
  EmojiPicker,
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
  ListboxItem,
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
  TextInput,
  Textarea,
  TimeField,
  TimePicker,
  UrlInput,
  Wizard,
  WizardFooter,
  WizardStep,
  WizardSteps,
  type DateRange,
  type Gradient,
  type RecurrenceRule,
  type SelectOption,
  type TimeValue,
} from '@wow-two-beta/ui/forms';

/* ── helpers ─────────────────────────────────────────────────────────── */

function Demo({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4' +
        (wide ? ' md:col-span-2 xl:col-span-3' : '')
      }
    >
      <div className="min-w-0 flex-1">{children}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

/* ── 1 · field scaffolding ───────────────────────────────────────────── */

function ScaffoldingSection() {
  const [bio, setBio] = useState('Building the wow-two UI beta.');
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Field scaffolding"
        description="Labels, helper copy, grouping, and addon wrappers."
        size="md"
      />
      <Grid>
        <Demo label="Label + TextInput">
          <div className="flex max-w-xs flex-col gap-1.5">
            <Label htmlFor="fg-name" isRequired>
              Project name
            </Label>
            <TextInput id="fg-name" placeholder="wow-two" defaultValue="haven" />
          </div>
        </Demo>
        <Demo label="FormHelperText / FormErrorMessage (standalone)">
          <div className="flex max-w-xs flex-col gap-1.5">
            <TextInput placeholder="API token" state="invalid" defaultValue="tok_" />
            <FormHelperText>Find it under Settings → Tokens.</FormHelperText>
            <FormErrorMessage>Token must be 32 characters.</FormErrorMessage>
          </div>
        </Demo>
        <Demo label="FormField — label, helper, error wiring">
          <div className="flex max-w-xs flex-col gap-4">
            <FormField label="Workspace slug" helper="Lowercase, hyphens only." isRequired>
              <TextInput placeholder="my-workspace" />
            </FormField>
            <FormField label="Billing email" error="This email is already in use.">
              <EmailInput defaultValue="ops@wow.two" />
            </FormField>
          </div>
        </Demo>
        <Demo label="LabeledInput — inline trailing slot">
          <div className="max-w-xs">
            <LabeledInput label="Display name" trailing="Optional">
              <TextInput placeholder="Shown on your profile" />
            </LabeledInput>
          </div>
        </Demo>
        <Demo label="Fieldset + Legend">
          <Fieldset className="max-w-xs">
            <Legend>Notification channel</Legend>
            <div className="flex flex-col gap-2">
              <RadioField name="fg-channel" value="email" label="Email" defaultChecked />
              <RadioField name="fg-channel" value="sms" label="SMS" />
            </div>
          </Fieldset>
        </Demo>
        <Demo label="InputGroup + InputAddon">
          <div className="flex max-w-sm flex-col gap-3">
            <InputAddon leading="https://" trailing=".dev">
              <TextInput placeholder="subdomain" defaultValue="wow-two" />
            </InputAddon>
            <InputGroup orientation="horizontal">
              <TextInput placeholder="First name" />
              <TextInput placeholder="Last name" />
            </InputGroup>
          </div>
        </Demo>
        <Demo label="Textarea + CharacterCount">
          <div className="flex max-w-sm flex-col gap-1.5">
            <Textarea
              value={bio}
              maxLength={120}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio"
            />
            <div className="self-end">
              <CharacterCount value={bio.length} max={120} />
            </div>
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 2 · text inputs ─────────────────────────────────────────────────── */

function TextInputsSection() {
  const [search, setSearch] = useState('design tokens');
  const [password, setPassword] = useState('hunter2!');
  const [pinDone, setPinDone] = useState('');
  const [tags, setTags] = useState<string[]>(['react', 'tailwind']);
  const [phone, setPhone] = useState('+14155550123');
  const [cron, setCron] = useState('0 9 * * 1-5');
  const [masked, setMasked] = useState('');
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Text inputs"
        description="Typed single-line inputs, masks, and structured entry."
        size="md"
      />
      <Grid>
        <Demo label="TextInput / EmailInput / TelInput / UrlInput">
          <div className="flex max-w-xs flex-col gap-2">
            <TextInput placeholder="Plain text" size="sm" />
            <EmailInput placeholder="you@example.com" size="sm" />
            <TelInput placeholder="+1 415 555 0123" size="sm" />
            <UrlInput placeholder="https://wow.two" size="sm" />
          </div>
        </Demo>
        <Demo label="NumberInput / CurrencyInput / PercentInput">
          <div className="flex max-w-xs flex-col gap-2">
            <NumberInput defaultValue={42} step={1} min={0} max={100} size="sm" />
            <CurrencyInput symbol="$" defaultValue={1299} size="sm" />
            <PercentInput defaultValue={65} min={0} max={100} size="sm" />
          </div>
        </Demo>
        <Demo label="PasswordInput + PasswordStrength">
          <div className="flex max-w-xs flex-col gap-2">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <PasswordStrength value={password} />
          </div>
        </Demo>
        <Demo label="SearchInput — clearable">
          <div className="max-w-xs">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search docs…"
            />
          </div>
        </Demo>
        <Demo label="MaskedInput — (###) ###-####">
          <div className="flex max-w-xs flex-col gap-1.5">
            <MaskedInput
              mask="(###) ###-####"
              value={masked}
              onValueChange={setMasked}
              placeholder="(555) 123-4567"
            />
            <p className="text-xs text-subtle-foreground">raw: {masked || '—'}</p>
          </div>
        </Demo>
        <Demo label="PinInput — onComplete">
          <div className="flex flex-col gap-1.5">
            <PinInput length={4} onComplete={setPinDone} aria-label="Verification code" />
            <p className="text-xs text-subtle-foreground">
              {pinDone ? `Code entered: ${pinDone}` : 'Enter 4 digits'}
            </p>
          </div>
        </Demo>
        <Demo label="TagsInput — Enter or comma commits">
          <div className="max-w-sm">
            <TagsInput value={tags} onValueChange={setTags} placeholder="Add a tag…" max={6} />
          </div>
        </Demo>
        <Demo label="PhoneInput — E.164 output">
          <div className="flex max-w-sm flex-col gap-1.5">
            <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="US" />
            <p className="text-xs text-subtle-foreground">{phone || '—'}</p>
          </div>
        </Demo>
        <Demo label="CronInput — human preview">
          <div className="max-w-sm">
            <CronInput value={cron} onValueChange={setCron} hasPreview />
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 3 · choice controls ─────────────────────────────────────────────── */

function ChoiceSection() {
  const [agreed, setAgreed] = useState(true);
  const [features, setFeatures] = useState<string[]>(['ssr']);
  const [tier, setTier] = useState<string | null>('pro');
  const [plan, setPlan] = useState('starter');
  const [dark, setDark] = useState(true);
  const [volume, setVolume] = useState(35);
  const [gain, setGain] = useState(0.6);
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Choice controls"
        description="Checkboxes, radios, switches, sliders, and cards."
        size="md"
      />
      <Grid>
        <Demo label="Checkbox — checked, indeterminate, disabled">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-label="Agree"
            />
            <Checkbox isIndeterminate aria-label="Partially selected" />
            <Checkbox disabled aria-label="Disabled" />
          </div>
        </Demo>
        <Demo label="CheckboxField + CheckboxGroup">
          <CheckboxGroup legend="Build features" value={features} onValueChange={setFeatures}>
            <CheckboxField value="ssr" label="SSR" description="Server-side rendering" />
            <CheckboxField value="islands" label="Islands" description="Partial hydration" />
            <CheckboxField value="rsc" label="RSC" description="React Server Components" />
          </CheckboxGroup>
        </Demo>
        <Demo label="Radio + RadioField + RadioGroup">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Radio name="fg-bare" defaultChecked aria-label="Option A" />
              <Radio name="fg-bare" aria-label="Option B" />
            </div>
            <RadioGroup
              legend="Support tier"
              value={tier}
              onValueChange={setTier}
              orientation="horizontal"
            >
              <RadioField value="free" label="Free" />
              <RadioField value="pro" label="Pro" />
              <RadioField value="enterprise" label="Enterprise" />
            </RadioGroup>
          </div>
        </Demo>
        <Demo label="Switch + SwitchField">
          <div className="flex flex-col gap-3">
            <Switch
              checked={dark}
              onChange={(e) => setDark(e.target.checked)}
              aria-label="Dark mode"
            />
            <SwitchField
              label="Weekly digest"
              description="One email every Monday."
              defaultChecked
            />
          </div>
        </Demo>
        <Demo label="ChoiceCard — radio as a card" wide>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <ChoiceCard
              name="fg-plan"
              value="starter"
              label="Starter"
              description="1 project, community support"
              checked={plan === 'starter'}
              onChange={() => setPlan('starter')}
            />
            <ChoiceCard
              name="fg-plan"
              value="team"
              label="Team"
              description="10 projects, shared workspaces"
              checked={plan === 'team'}
              onChange={() => setPlan('team')}
            />
            <ChoiceCard
              name="fg-plan"
              value="scale"
              label="Scale"
              description="Unlimited projects, SSO"
              checked={plan === 'scale'}
              onChange={() => setPlan('scale')}
            />
          </div>
        </Demo>
        <Demo label="Slider — native range">
          <div className="flex max-w-xs flex-col gap-1.5">
            <Slider
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
            <p className="text-xs text-subtle-foreground">volume: {volume}</p>
          </div>
        </Demo>
        <Demo label="Knob — drag / wheel / arrows">
          <div className="flex items-center gap-6">
            <Knob
              value={gain}
              onValueChange={setGain}
              min={0}
              max={1}
              step={0.01}
              aria-label="Gain"
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <Knob defaultValue={0.3} tone="warning" size={56} aria-label="Drive" />
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 4 · selection lists ─────────────────────────────────────────────── */

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian' },
  { value: 'elderberry', label: 'Elderberry' },
];

function SelectionSection() {
  const [picked, setPicked] = useState<string | undefined>('banana');
  const [fruitKey, setFruitKey] = useState<string | null>('apple');
  const [groupedKey, setGroupedKey] = useState<string | null>('react');
  const [regionKey, setRegionKey] = useState<string | null>(null);
  const [stack, setStack] = useState<string[]>(['react']);
  const [comboValue, setComboValue] = useState('');
  const [comboInput, setComboInput] = useState('');
  const comboMatches = FRUITS.filter((f) =>
    f.label.toLowerCase().includes(comboInput.toLowerCase()),
  );
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Selection"
        description="Inline listbox plus popover-based pickers."
        size="md"
      />
      <Grid>
        <Demo label="Listbox + ListboxItem — single select">
          <div className="max-w-xs">
            <Listbox value={picked} onValueChange={setPicked} aria-label="Pick a fruit">
              <ListboxItem value="apple">Apple</ListboxItem>
              <ListboxItem value="banana">Banana</ListboxItem>
              <ListboxItem value="cherry" isDisabled>
                Cherry (sold out)
              </ListboxItem>
              <ListboxItem value="durian">Durian</ListboxItem>
            </Listbox>
          </div>
        </Demo>
        <Demo label="Select — trigger + searchable content">
          <div className="max-w-xs">
            <Select<string>
              value={fruitKey}
              onValueChange={(opt: SelectOption<string> | null) =>
                setFruitKey(opt?.itemKey ?? null)
              }
              isClearable
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a fruit…" />
              </SelectTrigger>
              <SelectContent isSearchable matchWidth>
                {FRUITS.map((f) => (
                  <SelectItem key={f.value} itemKey={f.value} label={f.label} />
                ))}
              </SelectContent>
            </Select>
          </div>
        </Demo>
        <Demo label="Select — groups, separator + disabled option">
          <div className="max-w-xs">
            <Select<string>
              value={groupedKey}
              onValueChange={(opt: SelectOption<string> | null) =>
                setGroupedKey(opt?.itemKey ?? null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a framework…" />
              </SelectTrigger>
              <SelectContent matchWidth>
                <Select.Group label="Frontend">
                  <SelectItem itemKey="react" label="React" />
                  <SelectItem itemKey="vue" label="Vue" />
                  <SelectItem itemKey="svelte" label="Svelte (waitlisted)" isDisabled />
                </Select.Group>
                <Select.Separator />
                <Select.Group label="Backend">
                  <SelectItem itemKey="dotnet" label=".NET" />
                  <SelectItem itemKey="node" label="Node" />
                </Select.Group>
              </SelectContent>
            </Select>
          </div>
        </Demo>
        <Demo label="Select — invalid via FormField error">
          <div className="max-w-xs">
            <FormField
              label="Region"
              error={regionKey ? undefined : 'Select a region to continue.'}
              isRequired
            >
              <Select<string>
                value={regionKey}
                onValueChange={(opt: SelectOption<string> | null) =>
                  setRegionKey(opt?.itemKey ?? null)
                }
                isClearable
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a region…" />
                </SelectTrigger>
                <SelectContent matchWidth>
                  <SelectItem itemKey="us-east" label="US East" />
                  <SelectItem itemKey="eu-west" label="EU West" />
                  <SelectItem itemKey="ap-south" label="AP South" />
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </Demo>
        <Demo label="MultiSelect — tag chips in trigger">
          <div className="max-w-sm">
            <MultiSelect value={stack} onValueChange={setStack}>
              <MultiSelectTrigger>
                <MultiSelectTags placeholder="Pick your stack…" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectItem value="react">React</MultiSelectItem>
                <MultiSelectItem value="vue">Vue</MultiSelectItem>
                <MultiSelectItem value="svelte">Svelte</MultiSelectItem>
                <MultiSelectItem value="solid">Solid</MultiSelectItem>
              </MultiSelectContent>
            </MultiSelect>
          </div>
        </Demo>
        <Demo label="Combobox — filter as you type">
          <div className="max-w-xs">
            <Combobox
              value={comboValue}
              onValueChange={setComboValue}
              inputValue={comboInput}
              onInputChange={setComboInput}
            >
              <ComboboxInput placeholder="Search fruit…" />
              <ComboboxContent>
                {comboMatches.length === 0 ? (
                  <ComboboxEmpty>No matches</ComboboxEmpty>
                ) : (
                  comboMatches.map((f) => (
                    <ComboboxItem key={f.value} value={f.value}>
                      {f.label}
                    </ComboboxItem>
                  ))
                )}
              </ComboboxContent>
            </Combobox>
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 5 · date & time ─────────────────────────────────────────────────── */

const JUNE = new Date(2026, 5, 1);

function DateTimeSection() {
  const [day, setDay] = useState<Date | null>(new Date(2026, 5, 12));
  const [range, setRange] = useState<DateRange | null>({
    start: new Date(2026, 5, 8),
    end: new Date(2026, 5, 12),
  });
  const [fieldDate, setFieldDate] = useState<Date | null>(new Date(2026, 5, 1));
  const [time, setTime] = useState<TimeValue | null>({ hours: 9, minutes: 30 });
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [pickedTime, setPickedTime] = useState<TimeValue | null>(null);
  const [pickedRange, setPickedRange] = useState<DateRange | null>(null);
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Date & time"
        description="Inline calendars, typed fields, and popover pickers."
        size="md"
      />
      <Grid>
        <Demo label="Calendar — single date">
          <Calendar value={day} onValueChange={setDay} defaultMonth={JUNE} />
        </Demo>
        <Demo label="RangeCalendar — start → end">
          <RangeCalendar value={range} onValueChange={setRange} defaultMonth={JUNE} />
        </Demo>
        <Demo label="DateField + TimeField — native typed fields">
          <div className="flex max-w-xs flex-col gap-2">
            <DateField value={fieldDate} onValueChange={setFieldDate} />
            <TimeField value={time} onValueChange={setTime} />
          </div>
        </Demo>
        <Demo label="DatePicker — popover calendar">
          <div className="max-w-xs">
            <DatePicker value={pickedDate} onValueChange={setPickedDate} />
          </div>
        </Demo>
        <Demo label="TimePicker — 15-min steps">
          <div className="max-w-xs">
            <TimePicker value={pickedTime} onValueChange={setPickedTime} minuteStep={15} />
          </div>
        </Demo>
        <Demo label="DateRangePicker — popover range">
          <div className="max-w-xs">
            <DateRangePicker value={pickedRange} onValueChange={setPickedRange} />
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 6 · color ───────────────────────────────────────────────────────── */

const SWATCHES = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

function ColorSection() {
  const [swatch, setSwatch] = useState<string | null>('#3b82f6');
  const [hex, setHex] = useState<string | null>('#22c55e');
  const [hue, setHue] = useState(210);
  const [area, setArea] = useState({ s: 0.8, v: 0.9 });
  const [wheelHue, setWheelHue] = useState(120);
  const [gradient, setGradient] = useState<Gradient>({
    kind: 'linear',
    angle: 90,
    stops: [
      { color: '#3b82f6', position: 0 },
      { color: '#a855f7', position: 100 },
    ],
  });
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Color"
        description="Swatches, channel sliders, areas, wheels, and full pickers."
        size="md"
      />
      <Grid>
        <Demo label="ColorSwatch + ColorSwatchPicker">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ColorSwatch color="#ef4444" />
              <ColorSwatch color="#3b82f680" />
              <ColorSwatch color="#22c55e" shape="circle" />
            </div>
            <ColorSwatchPicker colors={SWATCHES} value={swatch} onValueChange={setSwatch} />
          </div>
        </Demo>
        <Demo label="ColorField — hex entry with swatch preview">
          <div className="max-w-xs">
            <ColorField value={hex} onValueChange={setHex} placeholder="#rrggbb" />
          </div>
        </Demo>
        <Demo label="ColorSlider — hue channel">
          <div className="flex max-w-xs flex-col gap-1.5">
            <ColorSlider channel="hue" value={hue} onValueChange={setHue} aria-label="Hue" />
            <p className="text-xs text-subtle-foreground">hue: {Math.round(hue)}°</p>
          </div>
        </Demo>
        <Demo label="ColorArea — saturation × value">
          <div className="max-w-xs">
            <ColorArea
              hue={hue}
              saturation={area.s}
              value={area.v}
              onValueChange={(c) => setArea({ s: c.saturation, v: c.value })}
            />
          </div>
        </Demo>
        <Demo label="ColorWheel — hue ring">
          <ColorWheel value={wheelHue} onValueChange={setWheelHue} size={160} thickness={24} />
        </Demo>
        <Demo label="ColorPicker — popover behind swatch trigger">
          <ColorPicker defaultValue="#3b82f6" presets={SWATCHES} aria-label="Brand color" />
        </Demo>
        <Demo label="GradientPicker — kind / angle / stops" wide>
          <div className="max-w-md">
            <GradientPicker value={gradient} onValueChange={setGradient} />
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 7 · pickers ─────────────────────────────────────────────────────── */

function PickersSection() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState({ accepted: 0, rejected: 0 });
  const [icon, setIcon] = useState('');
  const [font, setFont] = useState('');
  const [emoji, setEmoji] = useState('🙂');
  const [reactions, setReactions] = useState<string[]>(['👍']);
  const [chord, setChord] = useState<string[]>(['Ctrl', 'K']);
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Pickers"
        description="Files, icons, fonts, emoji, and keyboard chords."
        size="md"
      />
      <Grid>
        <Demo label="FilePicker — button + preview">
          <FilePicker
            label="Choose file"
            preview={fileName ?? 'No file selected'}
            onFilesChange={(files) => setFileName(files?.item(0)?.name ?? null)}
          />
        </Demo>
        <Demo label="FileUpload — drop zone, max 3 files">
          <div className="flex flex-col gap-1.5">
            <FileUpload
              multiple
              maxFiles={3}
              label="Drop files here"
              hint="Up to 3 files, any type"
              onFilesChange={(accepted, rejected) =>
                setUploaded({ accepted: accepted.length, rejected: rejected.length })
              }
            />
            <p className="text-xs text-subtle-foreground">
              accepted: {uploaded.accepted} · rejected: {uploaded.rejected}
            </p>
          </div>
        </Demo>
        <Demo label="KeyboardShortcutPicker — click, then press a chord">
          <KeyboardShortcutPicker value={chord} onValueChange={setChord} />
        </Demo>
        <Demo label="IconPicker — searchable lucide grid">
          <div className="flex max-w-sm flex-col gap-1.5">
            <IconPicker value={icon} onValueChange={setIcon} columns={8} />
            <p className="text-xs text-subtle-foreground">picked: {icon || '—'}</p>
          </div>
        </Demo>
        <Demo label="FontPicker — live per-face preview">
          <div className="max-w-sm">
            <FontPicker value={font} onValueChange={setFont} />
          </div>
        </Demo>
        <Demo label="EmojiPicker + ReactionPicker">
          <div className="flex flex-col gap-3">
            <ReactionPicker
              selected={reactions}
              onSelect={(e) =>
                setReactions((prev) =>
                  prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
                )
              }
            />
            <div className="max-w-xs rounded-md border border-border">
              <EmojiPicker onSelect={setEmoji} cellSize={26} />
            </div>
            <p className="text-xs text-subtle-foreground">last emoji: {emoji}</p>
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 8 · editors ─────────────────────────────────────────────────────── */

const CODE_SAMPLE = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`;

const MD_SAMPLE = `# Release notes

- **Forms** gallery shipped
- 72 components covered`;

const JSON_SAMPLE = {
  name: '@wow-two-beta/ui',
  beta: true,
  downloads: 1280,
  tags: ['react', 'tailwind'],
};

function EditorsSection() {
  const [title, setTitle] = useState('Quarterly roadmap');
  const [rule, setRule] = useState<RecurrenceRule>({
    freq: 'WEEKLY',
    interval: 1,
    byDay: ['MO', 'WE', 'FR'],
  });
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Editors"
        description="Inline edit, code, markdown, JSON, and recurrence rules."
        size="md"
      />
      <Grid>
        <Demo label="Editable — preview / input / submit / cancel">
          <div className="flex flex-col gap-1.5">
            <Editable value={title} onValueChange={setTitle} canSubmitOnBlur={false}>
              <EditablePreview />
              <EditableInput size="sm" />
              <EditableSubmit />
              <EditableCancel />
            </Editable>
            <p className="text-xs text-subtle-foreground">committed: {title}</p>
          </div>
        </Demo>
        <Demo label="CodeEditor — gutter + Tab indent" wide>
          <CodeEditor defaultValue={CODE_SAMPLE} language="ts" minHeight="8rem" />
        </Demo>
        <Demo label="MarkdownEditor — write / preview toolbar" wide>
          <MarkdownEditor defaultValue={MD_SAMPLE} minHeight="8rem" />
        </Demo>
        <Demo label="JSONEditor — tree and text modes" wide>
          <JSONEditor defaultValue={JSON_SAMPLE} defaultMode="tree" minHeight="10rem" />
        </Demo>
        <Demo label="RecurrenceEditor — RRULE builder" wide>
          <div className="max-w-md">
            <RecurrenceEditor
              value={rule}
              onValueChange={setRule}
              from={new Date(2026, 5, 1)}
              previewCount={3}
            />
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── 9 · composite flows ─────────────────────────────────────────────── */

function CompositeSection() {
  const [step, setStep] = useState('account');
  const [wizardDone, setWizardDone] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const lastSent = sent.at(-1);
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Composite"
        description="Multi-field organisms — steppers, wizards, address, chat."
        size="md"
      />
      <Grid>
        <Demo label="Stepper — clickable steps + panels" wide>
          <Stepper value={step} onValueChange={setStep}>
            <StepperList>
              <StepperStep value="account" description="Email & password">
                Account
              </StepperStep>
              <StepperStep value="profile" description="Personal info">
                Profile
              </StepperStep>
              <StepperStep value="payment" description="Billing details">
                Payment
              </StepperStep>
            </StepperList>
            <StepperPanel value="account" className="mt-3 rounded-md border border-border p-3 text-sm">
              Account details form goes here.
            </StepperPanel>
            <StepperPanel value="profile" className="mt-3 rounded-md border border-border p-3 text-sm">
              Profile form goes here.
            </StepperPanel>
            <StepperPanel value="payment" className="mt-3 rounded-md border border-border p-3 text-sm">
              Payment form goes here.
            </StepperPanel>
          </Stepper>
        </Demo>
        <Demo label="Wizard — steps, validation, footer" wide>
          <Wizard onComplete={() => setWizardDone(true)}>
            <WizardSteps />
            <WizardStep id="plan" label="Plan" className="py-3 text-sm">
              Pick a plan for your workspace.
            </WizardStep>
            <WizardStep id="details" label="Details" className="py-3 text-sm">
              Tell us about your team.
            </WizardStep>
            <WizardStep id="confirm" label="Confirm" isFinal className="py-3 text-sm">
              {wizardDone ? 'All done — workspace created.' : 'Review and finish.'}
            </WizardStep>
            <WizardFooter />
          </Wizard>
        </Demo>
        <Demo label="AddressForm — country-aware fields" wide>
          <div className="max-w-lg">
            <AddressForm
              defaultValue={{
                country: 'US',
                line1: '1 Hacker Way',
                city: 'Menlo Park',
                region: 'CA',
                postalCode: '94025',
              }}
            />
          </div>
        </Demo>
        <Demo label="ChatComposer — Enter sends" wide>
          <div className="flex max-w-lg flex-col gap-1.5">
            <ChatComposer
              placeholder="Message #design…"
              onSubmit={(text) => setSent((prev) => [...prev, text])}
            />
            <p className="text-xs text-subtle-foreground">
              {lastSent ? `sent (${sent.length}): ${lastSent}` : 'Nothing sent yet'}
            </p>
          </div>
        </Demo>
      </Grid>
    </section>
  );
}

/* ── page ────────────────────────────────────────────────────────────── */

export default function FormsGallery() {
  return (
    <div className="flex flex-col gap-10 pb-16">
      <SectionHeader
        title="Forms"
        description="All 72 components from @wow-two-beta/ui/forms — inputs, choices, pickers, editors, and composite flows."
        size="xl"
      />
      <ScaffoldingSection />
      <TextInputsSection />
      <ChoiceSection />
      <SelectionSection />
      <DateTimeSection />
      <ColorSection />
      <PickersSection />
      <EditorsSection />
      <CompositeSection />
    </div>
  );
}
