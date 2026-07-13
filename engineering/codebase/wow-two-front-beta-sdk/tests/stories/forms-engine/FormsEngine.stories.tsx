import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { ApiError } from '@src/foundation/http';
import { Button } from '@src/presentation/actions';
import { Alert } from '@src/presentation/feedback';
import { Field, PasswordInput, TextInput } from '@src/presentation/forms';

import type { StandardSchemaV1 } from '@src/forms-engine/StandardSchema';
import { useFieldArray } from '@src/forms-engine/UseFieldArray';
import { useAppForm } from '@src/forms-engine/house';

/*
 * F-2d — the forms interaction tier: end-to-end `play()` flows on the HOUSE engine
 * (zero-dependency, so the Storybook surface never needs the tanstack peer). Every
 * demo composes the CANONICAL conventions (wow-two-ws forms.md): `form.Field` +
 * presentation `Field` chrome with zero error hand-wiring, submit via the pipeline,
 * `Subscribe` selectors for isSubmitting / submitError / live slices. In an app the
 * `useAppForm` import below lives in `src/form.ts` — the single engine-pin line.
 */

const meta: Meta = {
  title: 'Forms Engine/Flows',
};
export default meta;
type Story = StoryObj;

/** Builds a synchronous Standard Schema from an issue-producing check — spec-shaped, no schema lib (apps bring zod / valibot). */
function schemaOf<TValues extends object>(
  check: (values: TValues) => StandardSchemaV1.Issue[],
): StandardSchemaV1<TValues> {
  return {
    '~standard': {
      version: 1,
      vendor: 'story',
      validate: (value) => {
        const issues = check(value as TValues);
        return issues.length > 0 ? { issues } : { value: value as TValues };
      },
    },
  };
}

/* ══════════════════════════════ LoginServerError ══════════════════════════════ */

interface LoginValues {
  email: string;
  password: string;
}

const LOGIN_SCHEMA = schemaOf<LoginValues>((values) => {
  const issues: StandardSchemaV1.Issue[] = [];
  if (!values.email.includes('@')) issues.push({ message: 'Enter a valid email.', path: ['email'] });
  if (values.password.length < 8)
    issues.push({ message: 'Password must be at least 8 characters.', path: ['password'] });
  return issues;
});

const KNOWN_EMAIL = 'ada@example.io';
const CORRECT_PASSWORD = 'open-sesame-42';

/** Mutation-style auth call — rejects with ProblemDetails in BOTH .NET shapes (dict, then `[{ property, message }]`). */
async function authenticate(values: LoginValues): Promise<null> {
  if (values.email !== KNOWN_EMAIL) {
    // ASP.NET ValidationProblemDetails dict shape.
    throw new ApiError(401, {
      title: 'Sign-in failed',
      errors: { Email: ['No account matches this email.'] },
    });
  }
  if (values.password !== CORRECT_PASSWORD) {
    // wow-two `[{ property, message }]` shape.
    throw new ApiError(401, {
      title: 'Sign-in failed',
      errors: [{ property: 'Password', message: 'Incorrect password.' }],
    });
  }
  return null;
}

function LoginDemo() {
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const form = useAppForm<LoginValues>({
    defaultValues: { email: '', password: '' },
    schema: LOGIN_SCHEMA,
    onSubmit: async (values) => {
      await authenticate(values); // in an app: mutation.mutateAsync(values)
      setSignedInAs(values.email);
      return null;
    },
  });
  return (
    <form className="flex w-80 flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
      <form.Field name="email">
        {(f) => (
          <Field label="Email">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Field name="password">
        {(f) => (
          <Field label="Password">
            <PasswordInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(busy) => (
          <Button type="submit" isLoading={busy}>
            Sign in
          </Button>
        )}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.submitError}>
        {(error) => error && <Alert severity="danger" title="Sign-in failed" description={error.message} />}
      </form.Subscribe>
      {signedInAs && <Alert severity="success" title="Signed in" description={`Signed in as ${signedInAs}`} />}
    </form>
  );
}

/** validate → submit → server rejects (both .NET ProblemDetails shapes) → per-field errors via Field chrome → fix clears → resubmit success. */
export const LoginServerError: Story = {
  render: () => <LoginDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText<HTMLInputElement>('Email');
    const password = canvas.getByLabelText<HTMLInputElement>('Password');
    const submit = canvas.getByRole('button', { name: 'Sign in' });

    // Client gate: empty submit surfaces schema messages; the server is never called.
    await userEvent.click(submit);
    await expect(await canvas.findByText('Enter a valid email.')).toBeInTheDocument();
    await expect(canvas.getByText('Password must be at least 8 characters.')).toBeInTheDocument();

    // Client-valid but unknown email → the DICT-shape ProblemDetails lands on the email field.
    await userEvent.type(email, 'ada@wrong.io');
    await userEvent.type(password, 'hunter2-wrong');
    await waitFor(() => expect(canvas.queryByText('Enter a valid email.')).not.toBeInTheDocument());
    await userEvent.click(submit);
    const emailAlert = await canvas.findByRole('alert');
    await expect(emailAlert).toHaveTextContent('No account matches this email.');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email.getAttribute('aria-describedby')).toBe(emailAlert.id);
    await expect(password).not.toHaveAttribute('aria-invalid', 'true');

    // Fixing the field clears its server error on the next change.
    await userEvent.clear(email);
    await userEvent.type(email, KNOWN_EMAIL);
    await waitFor(() =>
      expect(canvas.queryByText('No account matches this email.')).not.toBeInTheDocument(),
    );

    // Resubmit → the ARRAY-shape `[{ property, message }]` lands on the password field.
    await userEvent.click(submit);
    const passwordAlert = await canvas.findByRole('alert');
    await expect(passwordAlert).toHaveTextContent('Incorrect password.');
    await expect(password.getAttribute('aria-describedby')).toBe(passwordAlert.id);

    // Fix the password → resubmit succeeds.
    await userEvent.clear(password);
    await userEvent.type(password, CORRECT_PASSWORD);
    await waitFor(() => expect(canvas.queryByText('Incorrect password.')).not.toBeInTheDocument());
    await userEvent.click(submit);
    await expect(await canvas.findByText(`Signed in as ${KNOWN_EMAIL}`)).toBeInTheDocument();
  },
};

/* ══════════════════════════════ ValuesTransform ══════════════════════════════ */

/* The `*Values` editable shape — `port` stays a forgiving string while typing;
   `onSubmit` resolves it into the typed dto (the models.md Values → Dto rule). */
interface RegisterServiceValues {
  name: string;
  port: string;
}

interface RegisterServiceDto {
  slug: string;
  port: number;
}

const toSlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

const REGISTER_SCHEMA = schemaOf<RegisterServiceValues>((values) => {
  const issues: StandardSchemaV1.Issue[] = [];
  if (values.name.trim() === '') issues.push({ message: 'Name is required.', path: ['name'] });
  const port = Number(values.port);
  if (!/^\d+$/.test(values.port) || port < 1 || port > 65535)
    issues.push({ message: 'Port must be a number between 1 and 65535.', path: ['port'] });
  return issues;
});

function RegisterServiceDemo() {
  const [registered, setRegistered] = useState<RegisterServiceDto | null>(null);
  const form = useAppForm<RegisterServiceValues>({
    defaultValues: { name: '', port: '' },
    schema: REGISTER_SCHEMA,
    onSubmit: async (values) => {
      // The transform: string inputs → typed dto, resolved once at the submit seam.
      setRegistered({ slug: toSlug(values.name), port: Number(values.port) });
      return null;
    },
  });
  return (
    <form className="flex w-80 flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
      <form.Field name="name">
        {(f) => (
          <Field label="Service name">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Field name="port">
        {(f) => (
          <Field label="Port" helper="1–65535.">
            <TextInput inputMode="numeric" value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      {/* Live derived UI through a selector — re-renders on the selected slice only. */}
      <form.Subscribe selector={(s) => s.values.name}>
        {(name) => (
          <p className="text-sm text-muted-foreground">
            Registers as <code data-testid="slug-preview">{toSlug(name) || '—'}</code>
          </p>
        )}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(busy) => (
          <Button type="submit" isLoading={busy}>
            Register
          </Button>
        )}
      </form.Subscribe>
      {registered && (
        <Alert
          severity="success"
          title="Service registered"
          description={<code data-testid="registered-dto">{JSON.stringify(registered)}</code>}
        />
      )}
    </form>
  );
}

/** String inputs map to a typed dto on submit; a `Subscribe` selector derives the slug preview live. */
export const ValuesTransform: Story = {
  render: () => <RegisterServiceDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByLabelText<HTMLInputElement>('Service name');
    const port = canvas.getByLabelText<HTMLInputElement>('Port');

    // The slug preview derives live off the name slice.
    await userEvent.type(name, 'Metrics Relay');
    await waitFor(() => expect(canvas.getByTestId('slug-preview')).toHaveTextContent('metrics-relay'));

    // Non-numeric port fails the schema at the submit gate.
    await userEvent.type(port, '80x80');
    await userEvent.click(canvas.getByRole('button', { name: 'Register' }));
    await expect(await canvas.findByText('Port must be a number between 1 and 65535.')).toBeInTheDocument();
    await expect(canvas.queryByTestId('registered-dto')).not.toBeInTheDocument();

    // Fix → submit: the dto carries a NUMBER 8080 (no quotes in the JSON) + the derived slug.
    await userEvent.clear(port);
    await userEvent.type(port, '8080');
    await waitFor(() =>
      expect(canvas.queryByText('Port must be a number between 1 and 65535.')).not.toBeInTheDocument(),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Register' }));
    const dto = await canvas.findByTestId('registered-dto');
    await expect(dto).toHaveTextContent('{"slug":"metrics-relay","port":8080}');
  },
};

/* ══════════════════════════════ ArrayRows ══════════════════════════════ */

interface RedirectRuleValues {
  destination: string;
}

interface RedirectValues {
  rules: RedirectRuleValues[];
}

const RULES_SCHEMA = schemaOf<RedirectValues>((values) =>
  values.rules.flatMap((rule, index) =>
    rule.destination.startsWith('https://')
      ? []
      : [{ message: 'Destination must use https.', path: ['rules', index, 'destination'] }],
  ),
);

/** Mutation-style save — rejects with a row-scoped server path (`Rules[i].Destination`, PascalCase remapped by the pipeline). */
async function saveRules(values: RedirectValues): Promise<null> {
  const blocked = values.rules.findIndex((rule) => rule.destination.includes('blocked.example'));
  if (blocked >= 0) {
    throw new ApiError(400, {
      title: 'Validation failed',
      errors: { [`Rules[${blocked}].Destination`]: ['Destination is blocked.'] },
    });
  }
  return null;
}

function RedirectRulesDemo() {
  const [saved, setSaved] = useState(false);
  const form = useAppForm<RedirectValues>({
    defaultValues: { rules: [{ destination: '' }] },
    schema: RULES_SCHEMA,
    onSubmit: async (values) => {
      await saveRules(values);
      setSaved(true);
      return null;
    },
  });
  // The typed row helper: reactive rows + stable keys + element-typed ops + a CAST-FREE row
  // field — `f.value` is `string` (RedirectRuleValues['destination']), no `as string` per row.
  const rules = useFieldArray<RedirectRuleValues>(form, 'rules');
  return (
    <form className="flex w-96 flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
      {rules.rows.map((row) => (
        <div key={row.key} className="flex items-start gap-2">
          <rules.Field index={row.index} name="destination">
            {(f) => (
              <Field label={`Destination ${row.index + 1}`} className="flex-1">
                <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
              </Field>
            )}
          </rules.Field>
          <Button
            variant="outline"
            size="sm"
            className="mt-7"
            isDisabled={row.index === 0}
            onClick={() => rules.move(row.index, row.index - 1)}
          >
            Move rule {row.index + 1} up
          </Button>
          <Button variant="outline" size="sm" className="mt-7" onClick={() => rules.remove(row.index)}>
            Remove rule {row.index + 1}
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={() => rules.push({ destination: '' })}>
        Add rule
      </Button>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(busy) => (
          <Button type="submit" isLoading={busy}>
            Save rules
          </Button>
        )}
      </form.Subscribe>
      {saved && <Alert severity="success" title="Rules saved." />}
    </form>
  );
}

/** Add / reorder / remove rows; per-row schema errors; a `Rules[i].Destination` server error follows its row through moves and removes. */
export const ArrayRows: Story = {
  render: () => <RedirectRulesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add a second row.
    await userEvent.click(canvas.getByRole('button', { name: 'Add rule' }));
    const first = canvas.getByLabelText<HTMLInputElement>('Destination 1');
    const second = canvas.getByLabelText<HTMLInputElement>('Destination 2');

    // Per-row client validation: only the http row errors.
    await userEvent.type(first, 'https://safe.example');
    await userEvent.type(second, 'http://plain.example');
    await userEvent.click(canvas.getByRole('button', { name: 'Save rules' }));
    const rowAlert = await canvas.findByRole('alert');
    await expect(rowAlert).toHaveTextContent('Destination must use https.');
    await expect(second).toHaveAttribute('aria-invalid', 'true');
    await expect(second.getAttribute('aria-describedby')).toBe(rowAlert.id);
    await expect(first).not.toHaveAttribute('aria-invalid', 'true');

    // Fix row 2 → its error clears; the server then rejects it as blocked (`Rules[1].Destination`).
    await userEvent.clear(second);
    await userEvent.type(second, 'https://blocked.example');
    await waitFor(() => expect(canvas.queryByRole('alert')).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole('button', { name: 'Save rules' }));
    await expect(await canvas.findByText('Destination is blocked.')).toBeInTheDocument();
    await expect(second).toHaveAttribute('aria-invalid', 'true');

    // Reorder: the server error FOLLOWS the row into position 1.
    await userEvent.click(canvas.getByRole('button', { name: 'Move rule 2 up' }));
    await waitFor(() => expect(canvas.getByLabelText('Destination 1')).toHaveValue('https://blocked.example'));
    const movedFirst = canvas.getByLabelText<HTMLInputElement>('Destination 1');
    const movedAlert = canvas.getByRole('alert');
    await expect(movedAlert).toHaveTextContent('Destination is blocked.');
    await expect(movedFirst).toHaveAttribute('aria-invalid', 'true');
    await expect(movedFirst.getAttribute('aria-describedby')).toBe(movedAlert.id);
    await expect(canvas.getByLabelText('Destination 2')).not.toHaveAttribute('aria-invalid', 'true');

    // Remove the blocked row → the error leaves with it; the survivor saves clean.
    await userEvent.click(canvas.getByRole('button', { name: 'Remove rule 1' }));
    await waitFor(() => expect(canvas.queryByRole('alert')).not.toBeInTheDocument());
    await expect(canvas.getAllByRole('textbox')).toHaveLength(1);
    await expect(canvas.getByLabelText('Destination 1')).toHaveValue('https://safe.example');
    await userEvent.click(canvas.getByRole('button', { name: 'Save rules' }));
    await expect(await canvas.findByText('Rules saved.')).toBeInTheDocument();
  },
};

/* ══════════════════════════════ AsyncSchemaValidation ══════════════════════════════ */

interface HandleValues {
  handle: string;
}

const TAKEN_HANDLES = ['taken', 'admin'];

/** An async Standard Schema with a real delay — stands in for a server-backed availability check. */
const HANDLE_SCHEMA: StandardSchemaV1<HandleValues> = {
  '~standard': {
    version: 1,
    vendor: 'story',
    validate: (value) =>
      new Promise((resolve) => {
        setTimeout(() => {
          const values = value as HandleValues;
          const issues: StandardSchemaV1.Issue[] = [];
          if (values.handle.trim() === '') issues.push({ message: 'Handle is required.', path: ['handle'] });
          else if (TAKEN_HANDLES.includes(values.handle))
            issues.push({ message: 'Handle is taken.', path: ['handle'] });
          resolve(issues.length > 0 ? { issues } : { value: values });
        }, 150);
      }),
  },
};

function ClaimHandleDemo() {
  const [claimed, setClaimed] = useState<string | null>(null);
  const form = useAppForm<HandleValues>({
    defaultValues: { handle: '' },
    schema: HANDLE_SCHEMA,
    onSubmit: async (values) => {
      setClaimed(values.handle);
      return null;
    },
  });
  return (
    <form className="flex w-80 flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
      <form.Field name="handle">
        {(f) => (
          <Field label="Handle" helper="Checked against existing handles.">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.isValidating}>
        {(validating) => validating && <p role="status">Checking availability…</p>}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(busy) => (
          <Button type="submit" isLoading={busy}>
            Claim handle
          </Button>
        )}
      </form.Subscribe>
      {claimed && <Alert severity="success" title={`Handle claimed: ${claimed}`} />}
    </form>
  );
}

/** Async schema: submit awaits the pending validation (`isValidating` visible), blocks when taken, passes once free. */
export const AsyncSchemaValidation: Story = {
  render: () => <ClaimHandleDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByLabelText<HTMLInputElement>('Handle');

    // Default validateOn: 'submit' — typing stays silent before the first attempt.
    await userEvent.type(handle, 'taken');
    await expect(canvas.queryByText('Handle is taken.')).not.toBeInTheDocument();

    // Submit awaits the async pass: isValidating shows, then the issue lands and blocks onSubmit.
    await userEvent.click(canvas.getByRole('button', { name: 'Claim handle' }));
    await expect(await canvas.findByRole('status')).toHaveTextContent('Checking availability…');
    await expect(await canvas.findByText('Handle is taken.')).toBeInTheDocument();
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await expect(canvas.queryByText(/Handle claimed/)).not.toBeInTheDocument();

    // Post-attempt changes re-validate asynchronously; a free handle clears the error.
    await userEvent.clear(handle);
    await userEvent.type(handle, 'ada');
    await waitFor(() => expect(canvas.queryByText('Handle is taken.')).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.queryByRole('status')).not.toBeInTheDocument());

    // The next submit awaits validation again and reaches onSubmit.
    await userEvent.click(canvas.getByRole('button', { name: 'Claim handle' }));
    await expect(await canvas.findByText('Handle claimed: ada')).toBeInTheDocument();
  },
};

/* ══════════════════════════════ PrefillAndReset ══════════════════════════════ */

interface ProfileValues {
  handle: string;
  displayName: string;
  bio: string;
}

/* In an app this arrives via `/query`; the flow is identical — `reset(data)` once loaded. */
const LOADED_PROFILE: ProfileValues = {
  handle: 'ada',
  displayName: 'Ada Lovelace',
  bio: 'Analyst, metaphysician.',
};

function EditProfileDemo() {
  const form = useAppForm<ProfileValues>({
    defaultValues: { handle: '', displayName: '', bio: '' },
    onSubmit: async () => null,
  });
  return (
    <form className="flex w-80 flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => form.reset(LOADED_PROFILE)}>
          Load profile
        </Button>
        {/* Discard re-seeds with the loaded entity — a bare `reset()` would return to the pre-load defaults. */}
        <Button variant="outline" onClick={() => form.reset(LOADED_PROFILE)}>
          Discard changes
        </Button>
      </div>
      <form.Field name="handle">
        {(f) => (
          /* Per-mode flag on the chrome: the handle is locked in edit mode. */
          <Field label="Handle" isDisabled helper="Handles cannot be changed.">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Field name="displayName">
        {(f) => (
          <Field label="Display name">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Field name="bio">
        {(f) => (
          <Field label="Bio">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.isDirty}>
        {(isDirty) => <p role="status">{isDirty ? 'Unsaved changes' : 'All changes saved'}</p>}
      </form.Subscribe>
    </form>
  );
}

/** `reset(data)` prefill lands clean (new dirty baseline); edits flip `isDirty`; discard re-seeds back to the loaded entity. */
export const PrefillAndReset: Story = {
  render: () => <EditProfileDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const displayName = canvas.getByLabelText<HTMLInputElement>('Display name');
    const status = canvas.getByRole('status');
    await expect(status).toHaveTextContent('All changes saved');

    // Prefill: values land AND the form stays clean — reset(data) re-seeds the dirty baseline.
    await userEvent.click(canvas.getByRole('button', { name: 'Load profile' }));
    await waitFor(() => expect(displayName).toHaveValue('Ada Lovelace'));
    await expect(canvas.getByLabelText('Bio')).toHaveValue('Analyst, metaphysician.');
    await expect(canvas.getByLabelText('Handle')).toBeDisabled();
    await expect(status).toHaveTextContent('All changes saved');

    // Dirty is baseline-compared: an edit flips it, undoing the edit flips it back.
    await userEvent.type(displayName, 'X');
    await waitFor(() => expect(status).toHaveTextContent('Unsaved changes'));
    await userEvent.type(displayName, '{backspace}');
    await waitFor(() => expect(status).toHaveTextContent('All changes saved'));

    // Edit → dirty → discard re-seeds the loaded entity and lands clean.
    await userEvent.type(displayName, ' Byron');
    await waitFor(() => expect(status).toHaveTextContent('Unsaved changes'));
    await userEvent.click(canvas.getByRole('button', { name: 'Discard changes' }));
    await waitFor(() => expect(displayName).toHaveValue('Ada Lovelace'));
    await expect(status).toHaveTextContent('All changes saved');
  },
};
