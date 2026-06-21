import { useMemo, useState } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import { Avatar, Tabs, TabsList, TabsTab, TabsPanel } from '@wow-two-beta/ui/display';
import { useToaster } from '@wow-two-beta/ui/feedback';
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  Editable,
  EditableInput,
  EditablePreview,
  EmailInput,
  Fieldset,
  FileUpload,
  FormErrorMessage,
  FormField,
  FormHelperText,
  KeyboardShortcutPicker,
  LabeledInput,
  Legend,
  PhoneInput,
  RadioField,
  RadioGroup,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  SwitchField,
  TagsInput,
  TextInput,
  UrlInput,
} from '@wow-two-beta/ui/forms';
import { users } from '../../fixtures';

/* Deterministic profile defaults — derived from the fixture owner (usr-001). */
const owner = users.find((u) => u.role === 'owner');
const DEFAULT_NAME = owner?.name ?? 'Sora Tanaka';
const DEFAULT_EMAIL = owner?.email ?? 'sora@drydock.dev';
const DEFAULT_HANDLE = owner?.handle ?? 'sora';

const TIMEZONES = [
  { key: 'utc', label: 'UTC' },
  { key: 'europe-london', label: 'Europe/London (GMT+1)' },
  { key: 'europe-berlin', label: 'Europe/Berlin (GMT+2)' },
  { key: 'asia-tashkent', label: 'Asia/Tashkent (GMT+5)' },
  { key: 'asia-tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { key: 'america-new-york', label: 'America/New_York (GMT-4)' },
] as const;

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
  { value: 'uz', label: "O'zbekcha" },
  { value: 'ru', label: 'Русский' },
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/* ---------------------------------- Profile ---------------------------------- */

function ProfileTab() {
  const { toast } = useToaster();
  const [displayName, setDisplayName] = useState(DEFAULT_HANDLE);
  const [fullName, setFullName] = useState(DEFAULT_NAME);
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [website, setWebsite] = useState('https://drydock.dev');
  const [phone, setPhone] = useState('+15550104242');
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Avatar">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            <Avatar name={fullName} canAutoColor size="2xl" />
            <span className="text-xs text-muted-foreground">
              {avatarFileName ?? 'Initials fallback'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <FileUpload
              accept="image/*"
              maxSize={2 * 1024 * 1024}
              label="Drop a new avatar here, or click to browse"
              hint="PNG or JPG, up to 2 MB"
              onFilesChange={(accepted, rejected) => {
                const first = accepted[0];
                if (first) {
                  setAvatarFileName(first.name);
                  toast({
                    title: 'Avatar staged',
                    description: `${first.name} will apply on save.`,
                    severity: 'success',
                  });
                }
                const firstRejected = rejected[0];
                if (firstRejected) {
                  toast({
                    title: 'File rejected',
                    description: `${firstRejected.file.name} (reason: ${firstRejected.reason})`,
                    severity: 'danger',
                  });
                }
              }}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Identity">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Display name</span>
          <Editable value={displayName} onValueChange={setDisplayName} placeholder="Add a display name…">
            <EditablePreview />
            <EditableInput size="sm" />
          </Editable>
          <p className="text-xs text-muted-foreground">
            Click the name to edit inline. Enter commits, Escape cancels.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledInput label="Full name">
            <TextInput
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Lovelace"
            />
          </LabeledInput>
          <LabeledInput label="Email">
            <EmailInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </LabeledInput>
          <LabeledInput label="Website" trailing="Optional">
            <UrlInput
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </LabeledInput>
          <LabeledInput label="Phone" trailing="Optional">
            <PhoneInput value={phone} onValueChange={setPhone} defaultCountry="US" />
          </LabeledInput>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            toast({
              title: 'Profile saved',
              description: `${fullName} (@${displayName}) · ${email}`,
              severity: 'success',
            })
          }
        >
          Save profile
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------- Preferences -------------------------------- */

function PreferencesTab() {
  const { toast } = useToaster();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [digestTopics, setDigestTopics] = useState<string[]>(['deploys', 'billing']);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [density, setDensity] = useState<string | null>('comfortable');
  const [timezone, setTimezone] = useState<string | null>('asia-tashkent');
  const [language, setLanguage] = useState('en');
  const [languageInput, setLanguageInput] = useState('');
  const [volume, setVolume] = useState(60);
  const [paletteShortcut, setPaletteShortcut] = useState<string[]>(['Meta', 'K']);

  const languageMatches = useMemo(
    () =>
      LANGUAGES.filter((l) =>
        l.label.toLowerCase().includes(languageInput.trim().toLowerCase()),
      ),
    [languageInput],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Notifications">
        <SwitchField
          label="Email notifications"
          description="Mentions, review requests and deploy failures."
          checked={emailNotifs}
          onChange={(e) => setEmailNotifs(e.target.checked)}
        />
        <SwitchField
          label="Desktop notifications"
          description="Native push while the app tab is in the background."
          checked={desktopNotifs}
          onChange={(e) => setDesktopNotifs(e.target.checked)}
        />
        <label className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Notification sounds</span>
            <span className="text-xs text-muted-foreground">Raw Switch atom, label wired manually.</span>
          </span>
          <Switch
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Notification volume · {volume}%
          </span>
          <Slider
            min={0}
            max={100}
            step={5}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            disabled={!soundEnabled}
            aria-label="Notification volume"
          />
        </div>
      </SectionCard>

      <SectionCard title="Weekly digest">
        <CheckboxGroup
          legend="Topics to include"
          value={digestTopics}
          onValueChange={setDigestTopics}
        >
          <CheckboxField value="deploys" label="Deploy summaries" description="Frequency, failures, rollbacks." />
          <CheckboxField value="billing" label="Billing events" description="Invoices, payment issues." />
          <CheckboxField value="tickets" label="Support tickets" description="Open vs. resolved counts." />
          <CheckboxField value="usage" label="Usage trends" description="API requests and seat activity." />
        </CheckboxGroup>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
            aria-label="Include resolved threads"
          />
          <span className="text-sm text-foreground">Include resolved threads in the digest</span>
        </label>
      </SectionCard>

      <SectionCard title="Appearance & locale">
        <RadioGroup
          legend="Interface density"
          value={density}
          onValueChange={setDensity}
          orientation="horizontal"
        >
          <RadioField value="comfortable" label="Comfortable" />
          <RadioField value="compact" label="Compact" />
          <RadioField value="spacious" label="Spacious" />
        </RadioGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Timezone"
            helper={timezone ? 'Used for digests and scheduled deploys.' : undefined}
            error={timezone ? undefined : 'Pick a timezone — clearing it wires invalid state to the Select.'}
          >
            <Select<string>
              value={timezone}
              onValueChange={(opt) => setTimezone(opt?.itemKey ?? null)}
              isClearable
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a timezone…" />
              </SelectTrigger>
              <SelectContent matchWidth>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.key} itemKey={tz.key} label={tz.label} />
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Language</span>
            <Combobox
              value={language}
              onValueChange={setLanguage}
              inputValue={languageInput}
              onInputChange={setLanguageInput}
            >
              <ComboboxInput placeholder="Search languages…" />
              <ComboboxContent>
                {languageMatches.length === 0 ? (
                  <ComboboxEmpty>No matching language</ComboboxEmpty>
                ) : (
                  languageMatches.map((l) => (
                    <ComboboxItem key={l.value} value={l.value}>
                      {l.label}
                    </ComboboxItem>
                  ))
                )}
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Command palette shortcut</span>
          <div>
            <KeyboardShortcutPicker
              value={paletteShortcut}
              onValueChange={setPaletteShortcut}
              placeholder="Click to record a chord"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            toast({
              title: 'Preferences saved',
              description: `${digestTopics.length} digest topics · density ${density ?? 'unset'} · ${
                timezone ?? 'no timezone'
              }`,
              severity: 'success',
            })
          }
        >
          Save preferences
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Workspace --------------------------------- */

function WorkspaceTab() {
  const { toast } = useToaster();
  const [workspaceName, setWorkspaceName] = useState('Drydock Ops');
  /* Intentionally invalid out of the box — uppercase + space + bang. */
  const [slug, setSlug] = useState('Drydock Ops!');
  const [topics, setTopics] = useState<string[]>(['deploys', 'incidents', 'runbooks']);
  const [memberQuery, setMemberQuery] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const slugError = SLUG_PATTERN.test(slug)
    ? undefined
    : 'Lowercase letters, numbers and single dashes only — try "drydock-ops".';

  const memberMatches = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q),
    );
  }, [memberQuery]);

  const confirmMismatch = confirmText.length > 0 && confirmText !== slug;

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Identity">
        <Fieldset className="flex flex-col gap-4">
          <Legend>Workspace identity</Legend>
          <FormField
            label="Workspace name"
            helper="Shown in the sidebar and on invoices."
          >
            <TextInput
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </FormField>
          <FormField label="Workspace slug" error={slugError} isRequired>
            <TextInput
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="drydock-ops"
            />
          </FormField>
        </Fieldset>
      </SectionCard>

      <SectionCard title="Discovery">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Workspace topics</span>
          <TagsInput
            value={topics}
            onValueChange={setTopics}
            placeholder="Add a topic and press Enter…"
            max={8}
          />
          <FormHelperText>
            Up to 8 topics. Duplicates are ignored; Enter or Tab commits.
          </FormHelperText>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Members</span>
          <SearchInput
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            onClear={() => setMemberQuery('')}
            placeholder="Filter members by name or handle…"
            aria-label="Filter members"
          />
          <FormHelperText>
            {memberMatches.length} of {users.length} members shown.
          </FormHelperText>
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {memberMatches.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-3 py-2">
                <Avatar name={u.name} canAutoColor size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{u.handle}</p>
                </div>
                <span className="text-xs text-subtle-foreground">{u.role}</span>
              </li>
            ))}
            {memberMatches.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                No members match “{memberQuery}”.
              </li>
            )}
          </ul>
        </div>
      </SectionCard>

      <SectionCard title="Danger zone">
        <Fieldset className="flex flex-col gap-2">
          <Legend>Delete workspace</Legend>
          <p className="text-sm text-muted-foreground">
            Type the workspace slug to arm the delete button. This showcase only fires a toast.
          </p>
          <TextInput
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={slug}
            aria-label="Confirm workspace slug"
          />
          {confirmMismatch && (
            <FormErrorMessage>Confirmation does not match the slug.</FormErrorMessage>
          )}
          <div>
            <Button
              variant="outline"
              tone="danger"
              isDisabled={confirmText !== slug}
              onClick={() =>
                toast({
                  title: 'Workspace deletion requested',
                  description: `"${workspaceName}" would be scheduled for deletion.`,
                  severity: 'danger',
                })
              }
            >
              Delete workspace
            </Button>
          </div>
        </Fieldset>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          isDisabled={Boolean(slugError)}
          onClick={() =>
            toast({
              title: 'Workspace saved',
              description: `${workspaceName} (${slug}) · ${topics.length} topics`,
              severity: 'success',
            })
          }
        >
          Save workspace
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------- Screen ----------------------------------- */

export default function SettingsScreen() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <p className="text-sm text-muted-foreground">
        Account, notification and workspace controls. Saves are local-only and fire a toast.
      </p>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTab value="profile">Profile</TabsTab>
          <TabsTab value="preferences">Preferences</TabsTab>
          <TabsTab value="workspace">Workspace</TabsTab>
        </TabsList>
        <TabsPanel value="profile" className="pt-4">
          <ProfileTab />
        </TabsPanel>
        <TabsPanel value="preferences" className="pt-4">
          <PreferencesTab />
        </TabsPanel>
        <TabsPanel value="workspace" className="pt-4">
          <WorkspaceTab />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
