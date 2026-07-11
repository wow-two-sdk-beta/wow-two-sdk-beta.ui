import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Link, RouterProvider, createMemoryRouter } from 'react-router-dom';

import { ApiError } from '../foundation/http';
import { Button } from '../presentation/actions';
import { Alert } from '../presentation/feedback';
import { Field, FileUpload, PasswordInput, TextInput, Wizard } from '../presentation/forms';
import { QueryProvider, createQueryClient, useAppQuery, useOptimisticMutation } from '../query';
import { useNavigationBlocker } from '../router';

import { focusFirstInvalid } from './FocusFirstInvalid';
import type { StandardSchemaV1 } from './StandardSchema';
import { useAppForm } from './house';

/*
 * F-2e — form-level pattern recipes, continuing the F-2d house style: each story is one
 * canonical-convention play() flow on the HOUSE engine (SB stays peer-free for the form
 * side). Router (`useNavigationBlocker`) and `/query` (`useOptimisticMutation`) compose
 * STORY-side — `/forms-engine` runtime stays router/query-free; the seams are the
 * `isDirty` slice and the `onSubmit` Promise. The autosave (draft-persistence) recipe is
 * deferred to W2-c storage v2 (docs/analysis/forms-vector-next.md §4 F-2e).
 */

const meta: Meta = {
  title: 'Forms Engine/Recipes',
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ══════════════════════════════ WizardPerStepValidation ══════════════════════════════ */

interface AccountStepValues {
  name: string;
  email: string;
}

interface WorkspaceStepValues {
  workspace: string;
}

const ACCOUNT_SCHEMA = schemaOf<AccountStepValues>((values) => {
  const issues: StandardSchemaV1.Issue[] = [];
  if (values.name.trim() === '') issues.push({ message: 'Enter your name.', path: ['name'] });
  if (!values.email.includes('@')) issues.push({ message: 'Enter a valid email.', path: ['email'] });
  return issues;
});

const WORKSPACE_SCHEMA = schemaOf<WorkspaceStepValues>((values) =>
  values.workspace.trim() === ''
    ? [{ message: 'Workspace name is required.', path: ['workspace'] }]
    : [],
);

/**
 * A wizard step backed by its own `useAppForm` — one schema per step, so the step's whole
 * submit pipeline IS the gate: `gate` resolves `true` only when `onSubmit` ran (schema
 * passed), capturing the step values at the submit seam. Feed `gate` to `Wizard.Step
 * validate` — the wizard advances only on `true`, and rejected steps show their errors
 * through the normal `Field` chrome.
 */
function useStepForm<TValues extends object>(
  defaultValues: TValues,
  schema: StandardSchemaV1<TValues>,
  onValid: (values: TValues) => void,
) {
  const passed = useRef(false);
  const onValidRef = useRef(onValid);
  onValidRef.current = onValid;
  const form = useAppForm<TValues>({
    defaultValues,
    schema,
    onSubmit: async (values) => {
      passed.current = true;
      onValidRef.current(values);
      return null;
    },
  });
  const gate = async (): Promise<boolean> => {
    passed.current = false;
    await form.handleSubmit();
    return passed.current;
  };
  return { form, gate };
}

function CreateTeamWizardDemo() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  /* Captured at each step's submit seam — complete by the time onComplete runs (gates passed). */
  const draft = useRef<{ account?: AccountStepValues; workspace?: WorkspaceStepValues }>({});

  /* Step forms live in the wizard's PARENT, so values survive step unmounts (Back keeps edits). */
  const account = useStepForm<AccountStepValues>(
    { name: '', email: '' },
    ACCOUNT_SCHEMA,
    (values) => (draft.current.account = values),
  );
  const workspace = useStepForm<WorkspaceStepValues>(
    { workspace: '' },
    WORKSPACE_SCHEMA,
    (values) => (draft.current.workspace = values),
  );

  return (
    <div className="w-[28rem] rounded-md border border-border bg-card p-4">
      <Wizard
        onComplete={async () => {
          const { account: owner, workspace: team } = draft.current;
          if (!owner || !team) return; // unreachable — the gates fill both before the final step
          await delay(120); // in an app: mutation.mutateAsync({ ...owner, ...team })
          setSubmitted(`Workspace ${team.workspace} created for ${owner.email}.`);
        }}
      >
        <Wizard.Steps />
        <Wizard.Step id="account" label="Account" validate={account.gate}>
          <account.form.Field name="name">
            {(f) => (
              <Field label="Your name">
                <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
              </Field>
            )}
          </account.form.Field>
          <account.form.Field name="email">
            {(f) => (
              <Field label="Email">
                <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
              </Field>
            )}
          </account.form.Field>
        </Wizard.Step>
        <Wizard.Step id="workspace" label="Workspace" validate={workspace.gate}>
          <workspace.form.Field name="workspace">
            {(f) => (
              <Field label="Workspace name">
                <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
              </Field>
            )}
          </workspace.form.Field>
        </Wizard.Step>
        <Wizard.Step id="review" label="Review" isFinal>
          <account.form.Subscribe selector={(s) => s.values}>
            {(owner) => (
              <workspace.form.Subscribe selector={(s) => s.values}>
                {(team) => (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p>
                      Owner: {owner.name} ({owner.email})
                    </p>
                    <p>Workspace: {team.workspace}</p>
                  </div>
                )}
              </workspace.form.Subscribe>
            )}
          </account.form.Subscribe>
          {submitted && <Alert severity="success" title={submitted} />}
        </Wizard.Step>
        <Wizard.Footer submitLabel="Create workspace" />
      </Wizard>
    </div>
  );
}

/** Per-step schema gates Next: invalid steps stay put with field errors; Back keeps edits; the final step submits the combined draft. */
export const WizardPerStepValidation: Story = {
  render: () => <CreateTeamWizardDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Next on an empty step 1 → BOTH step-1 schema errors render; the wizard does not advance.
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Enter your name.')).toBeInTheDocument();
    await expect(canvas.getByText('Enter a valid email.')).toBeInTheDocument();
    await expect(canvas.queryByLabelText('Workspace name')).not.toBeInTheDocument();

    // Valid step 1 → gate passes → step 2. Step-2's own gate blocks its empty submit the same way.
    await userEvent.type(canvas.getByLabelText('Your name'), 'Ada Lovelace');
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.io');
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    const workspaceInput = await canvas.findByLabelText('Workspace name');
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Workspace name is required.')).toBeInTheDocument();

    // Valid step 2 → review shows both steps' values (live Subscribe slices).
    await userEvent.type(workspaceInput, 'metrics-lab');
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Owner: Ada Lovelace (ada@example.io)')).toBeInTheDocument();
    await expect(canvas.getByText('Workspace: metrics-lab')).toBeInTheDocument();

    // Back keeps the step's edits — the step forms outlive step unmounts.
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(await canvas.findByLabelText('Workspace name')).toHaveValue('metrics-lab');
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));

    // Finish submits the combined draft.
    await userEvent.click(await canvas.findByRole('button', { name: 'Create workspace' }));
    await expect(
      await canvas.findByText('Workspace metrics-lab created for ada@example.io.'),
    ).toBeInTheDocument();
  },
};

/* ══════════════════════════════ DirtyNavigationGuard ══════════════════════════════ */

interface HeadlineValues {
  headline: string;
}

function GuardedEditorScreen() {
  const form = useAppForm<HeadlineValues>({
    defaultValues: { headline: 'Hello world' },
    onSubmit: async () => null,
  });
  /* The whole recipe: the form's `isDirty` slice feeds the router blocker. While dirty,
     in-app navigation parks in `blocker.state === 'blocked'` (and `beforeunload` guards
     tab closes) until the user resolves it — `reset()` stays, `proceed()` leaves. */
  const isDirty = form.useFormState((s) => s.isDirty);
  const blocker = useNavigationBlocker(isDirty);

  return (
    <div className="flex w-96 flex-col gap-3">
      <form.Field name="headline">
        {(f) => (
          <Field label="Headline">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.isDirty}>
        {(dirty) => <p role="status">{dirty ? 'Unsaved changes' : 'All changes saved'}</p>}
      </form.Subscribe>
      <Link className="text-sm text-primary underline" to="/dashboard">
        Go to dashboard
      </Link>
      {blocker.state === 'blocked' && (
        <>
          <Alert severity="warning" title="Unsaved changes" description="Leaving now discards your edits." />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => blocker.reset()}>
              Stay
            </Button>
            <Button onClick={() => blocker.proceed()}>Discard and leave</Button>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="flex flex-col gap-3">
      <p>Dashboard</p>
      <Link className="text-sm text-primary underline" to="/">
        Back to editor
      </Link>
    </div>
  );
}

function DirtyNavigationGuardDemo() {
  /* Story-side router harness — a real memory router, fresh per story run. */
  const [router] = useState(() =>
    createMemoryRouter([
      { path: '/', element: <GuardedEditorScreen /> },
      { path: '/dashboard', element: <DashboardScreen /> },
    ]),
  );
  return <RouterProvider router={router} />;
}

/** Clean forms navigate freely; a dirty form parks the navigation in a confirm — Stay resumes editing (edits intact), Discard-and-leave proceeds. */
export const DirtyNavigationGuard: Story = {
  render: () => <DirtyNavigationGuardDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Clean form → navigation passes with no confirm, in both directions.
    await expect(await canvas.findByRole('status')).toHaveTextContent('All changes saved');
    await userEvent.click(canvas.getByRole('link', { name: 'Go to dashboard' }));
    await expect(await canvas.findByText('Dashboard')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('link', { name: 'Back to editor' }));
    const headline = await canvas.findByLabelText<HTMLInputElement>('Headline');

    // Dirty form → the same navigation parks in the blocker; the editor stays mounted.
    await userEvent.type(headline, ' — updated');
    await expect(canvas.getByRole('status')).toHaveTextContent('Unsaved changes');
    await userEvent.click(canvas.getByRole('link', { name: 'Go to dashboard' }));
    await expect(await canvas.findByText('Leaving now discards your edits.')).toBeInTheDocument();
    await expect(canvas.queryByText('Dashboard')).not.toBeInTheDocument();

    // Stay → confirm clears, edits intact.
    await userEvent.click(canvas.getByRole('button', { name: 'Stay' }));
    await waitFor(() =>
      expect(canvas.queryByText('Leaving now discards your edits.')).not.toBeInTheDocument(),
    );
    await expect(canvas.getByLabelText('Headline')).toHaveValue('Hello world — updated');

    // Discard and leave → the parked navigation proceeds.
    await userEvent.click(canvas.getByRole('link', { name: 'Go to dashboard' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Discard and leave' }));
    await expect(await canvas.findByText('Dashboard')).toBeInTheDocument();
  },
};

/* ══════════════════════════════ OptimisticSubmit ══════════════════════════════ */

interface GuestbookEntry {
  id: number;
  message: string;
  /** Marks the locally-patched row while its mutation is in flight. */
  pending?: boolean;
}

interface GuestbookValues {
  message: string;
}

const GUESTBOOK_KEY = ['guestbook'];

const GUESTBOOK_SCHEMA = schemaOf<GuestbookValues>((values) =>
  values.message.trim() === '' ? [{ message: 'Write a message first.', path: ['message'] }] : [],
);

/** Story-side backend state — created per story run (inside the demo component). */
interface GuestbookServer {
  nextId: number;
  entries: GuestbookEntry[];
}

function GuestbookScreen({ server }: { server: GuestbookServer }) {
  const guestbook = useAppQuery<GuestbookEntry[]>({
    key: GUESTBOOK_KEY,
    queryFn: async () => {
      await delay(60);
      return [...server.entries];
    },
  });

  /* The optimistic seam: the cached list is patched BEFORE the request fires — the row
     appears instantly; a rejected mutation rolls the patch back, and settle reconciles
     the cache with server truth either way. */
  const sign = useOptimisticMutation<null, GuestbookValues>({
    mutationFn: async (values) => {
      await delay(400);
      if (values.message.toLowerCase().includes('spam')) {
        throw new ApiError(422, { title: 'Message flagged as spam.' });
      }
      server.entries = [...server.entries, { id: server.nextId++, message: values.message }];
      return null;
    },
    targets: [
      {
        key: GUESTBOOK_KEY,
        apply: (current: GuestbookEntry[] | undefined, values: GuestbookValues) => [
          ...(current ?? []),
          { id: -1, message: values.message, pending: true },
        ],
      },
    ],
  });

  const form = useAppForm<GuestbookValues>({
    defaultValues: { message: '' },
    schema: GUESTBOOK_SCHEMA,
    onSubmit: async (values) => {
      await sign.mutateAsync(values); // rejection flows into the submit pipeline → submitError
      form.reset(); // success → clear the composer
      return null;
    },
  });

  return (
    <div className="flex w-96 flex-col gap-3">
      {guestbook.loading && <p role="status">Loading guestbook…</p>}
      <ul className="flex flex-col gap-1">
        {(guestbook.data ?? []).map((entry) => (
          <li
            key={entry.pending ? `pending-${entry.message}` : entry.id}
            className="rounded-md bg-muted px-3 py-1.5 text-sm"
          >
            {entry.message}
            {entry.pending && <span className="text-muted-foreground"> — sending…</span>}
          </li>
        ))}
      </ul>
      <form className="flex flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
        <form.Field name="message">
          {(f) => (
            <Field label="Message">
              <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
            </Field>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(busy) => (
            <Button type="submit" isLoading={busy}>
              Sign guestbook
            </Button>
          )}
        </form.Subscribe>
        <form.Subscribe selector={(s) => s.submitError}>
          {(error) => error && <Alert severity="danger" title="Could not sign" description={error.message} />}
        </form.Subscribe>
      </form>
    </div>
  );
}

function OptimisticGuestbookDemo() {
  /* Fresh backend + query client per story run — no state leaks between runs. */
  const [server] = useState<GuestbookServer>(() => ({
    nextId: 2,
    entries: [{ id: 1, message: 'First!' }],
  }));
  const [client] = useState(() => createQueryClient());
  return (
    <QueryProvider client={client}>
      <GuestbookScreen server={server} />
    </QueryProvider>
  );
}

/** Submit patches the cached list instantly (— sending…), reconciles on success; a rejected submit rolls the row back and lands in `submitError`. */
export const OptimisticSubmit: Story = {
  render: () => <OptimisticGuestbookDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('First!')).toBeInTheDocument();
    const message = canvas.getByLabelText<HTMLInputElement>('Message');

    // Optimistic append: the row shows immediately, marked pending, while the request is in flight.
    await userEvent.type(message, 'Hello from Ada');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign guestbook' }));
    const optimisticRow = await canvas.findByText(/Hello from Ada/);
    await expect(optimisticRow).toHaveTextContent('sending…');

    // Success: settle reconciles with server truth — the row stays, the pending mark drops, the composer clears.
    await waitFor(() => expect(canvas.getByText(/Hello from Ada/)).not.toHaveTextContent('sending…'));
    await waitFor(() => expect(message).toHaveValue(''));

    // Failure: the optimistic row appears, then ROLLS BACK when the server rejects; the error lands form-level.
    await userEvent.type(message, 'Buy spam now');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign guestbook' }));
    await expect(await canvas.findByText(/Buy spam now/)).toHaveTextContent('sending…');
    await waitFor(() => expect(canvas.queryByText(/Buy spam now/)).not.toBeInTheDocument());
    await expect(await canvas.findByText('Message flagged as spam.')).toBeInTheDocument();

    // The failed message stays in the composer for editing; earlier entries are untouched.
    await expect(message).toHaveValue('Buy spam now');
    await expect(canvas.getByText(/Hello from Ada/)).toBeInTheDocument();
  },
};

/* ══════════════════════════════ FileUploadForm ══════════════════════════════ */

interface ReceiptValues {
  file: File | null;
}

const RECEIPT_SCHEMA = schemaOf<ReceiptValues>((values) => {
  const issues: StandardSchemaV1.Issue[] = [];
  const file = values.file;
  if (!file) {
    issues.push({ message: 'Attach a receipt.', path: ['file'] });
    return issues;
  }
  if (!file.name.toLowerCase().endsWith('.pdf'))
    issues.push({ message: 'Only PDF receipts are accepted.', path: ['file'] });
  if (file.size > 1_024) issues.push({ message: 'Receipt must be 1 KB or smaller.', path: ['file'] });
  return issues;
});

/** Mutation-style upload — rejects a duplicate with a ProblemDetails error targeting the file field. */
async function uploadReceipt(values: ReceiptValues): Promise<null> {
  await delay(60);
  if (values.file?.name === 'duplicate.pdf') {
    throw new ApiError(409, {
      title: 'Upload failed',
      errors: { File: ['This receipt was already uploaded.'] },
    });
  }
  return null;
}

function UploadReceiptDemo() {
  const [uploaded, setUploaded] = useState<string | null>(null);
  const form = useAppForm<ReceiptValues>({
    defaultValues: { file: null },
    schema: RECEIPT_SCHEMA,
    onSubmit: async (values) => {
      await uploadReceipt(values);
      setUploaded(values.file?.name ?? null);
      return null;
    },
  });
  return (
    <form className="flex w-96 flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
      <form.Field name="file">
        {(f) => (
          <Field label="Receipt" helper="PDF, up to 1 KB.">
            {/* The File goes INTO values; the schema owns type/size rules (server-shape parity).
                Control-level accept/maxSize would pre-filter picks before the schema could report them. */}
            <FileUpload onFilesChange={(accepted) => f.setValue(accepted[0] ?? null)}>
              {f.value && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span data-testid="picked-file">{f.value.name}</span> ({f.value.size} B)
                </p>
              )}
            </FileUpload>
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(busy) => (
          <Button type="submit" isLoading={busy}>
            Upload receipt
          </Button>
        )}
      </form.Subscribe>
      {uploaded && <Alert severity="success" title={`Receipt uploaded: ${uploaded}`} />}
    </form>
  );
}

/** The file lives in form values: schema gates type/size on submit, re-picks re-validate, and a server 409 lands on the file field's chrome. */
export const FileUploadForm: Story = {
  render: () => <UploadReceiptDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The Field label targets FileUpload's HIDDEN native input — pick files through it.
    const input = canvas.getByLabelText<HTMLInputElement>('Receipt');
    const submit = canvas.getByRole('button', { name: 'Upload receipt' });

    // Empty submit → required error through the field chrome; the hidden input carries aria-invalid.
    await userEvent.click(submit);
    await expect(await canvas.findByText('Attach a receipt.')).toBeInTheDocument();
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    // Wrong type → post-attempt re-validation swaps the message on pick, no resubmit needed.
    await userEvent.upload(input, new File(['x'], 'photo.png', { type: 'image/png' }));
    await expect(await canvas.findByText('Only PDF receipts are accepted.')).toBeInTheDocument();
    await expect(canvas.getByTestId('picked-file')).toHaveTextContent('photo.png');

    // Oversize → the size rule reports next.
    await userEvent.upload(
      input,
      new File([new Uint8Array(2048)], 'big.pdf', { type: 'application/pdf' }),
    );
    await expect(await canvas.findByText('Receipt must be 1 KB or smaller.')).toBeInTheDocument();

    // Client-valid duplicate → the server 409 lands on the FILE field (Field chrome, not a form-level alert).
    await userEvent.upload(input, new File(['ok'], 'duplicate.pdf', { type: 'application/pdf' }));
    await waitFor(() => expect(canvas.queryByRole('alert')).not.toBeInTheDocument());
    await userEvent.click(submit);
    await expect(await canvas.findByText('This receipt was already uploaded.')).toBeInTheDocument();
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    // Re-pick clears the server error; a clean file uploads.
    await userEvent.upload(input, new File(['ok'], 'receipt-2026-07.pdf', { type: 'application/pdf' }));
    await waitFor(() =>
      expect(canvas.queryByText('This receipt was already uploaded.')).not.toBeInTheDocument(),
    );
    await userEvent.click(submit);
    await expect(await canvas.findByText('Receipt uploaded: receipt-2026-07.pdf')).toBeInTheDocument();
  },
};

/* ══════════════════════════════ FocusFirstInvalid ══════════════════════════════ */

interface SignupValues {
  fullName: string;
  email: string;
  password: string;
}

const SIGNUP_SCHEMA = schemaOf<SignupValues>((values) => {
  const issues: StandardSchemaV1.Issue[] = [];
  if (values.fullName.trim() === '') issues.push({ message: 'Enter your full name.', path: ['fullName'] });
  if (!values.email.includes('@')) issues.push({ message: 'Enter a valid email.', path: ['email'] });
  if (values.password.length < 8)
    issues.push({ message: 'Password must be at least 8 characters.', path: ['password'] });
  return issues;
});

function SignupDemo() {
  const [created, setCreated] = useState(false);
  const form = useAppForm<SignupValues>({
    defaultValues: { fullName: '', email: '', password: '' },
    schema: SIGNUP_SCHEMA,
    onSubmit: async () => {
      setCreated(true);
      return null;
    },
  });
  return (
    <form
      className="flex w-80 flex-col gap-3"
      onSubmit={(event) => {
        const root = event.currentTarget; // React nulls currentTarget after the handler — capture before the await.
        void form.handleSubmit(event).then(() => focusFirstInvalid(root));
      }}
    >
      <form.Field name="fullName">
        {(f) => (
          <Field label="Full name">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
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
      <Button type="submit">Create account</Button>
      {created && <Alert severity="success" title="Account created." />}
    </form>
  );
}

/** Every rejected submit hops focus to the FIRST invalid control (DOM order) — typing lands there with no pointer travel until the form passes. */
export const FocusFirstInvalid: Story = {
  render: () => <SignupDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole('button', { name: 'Create account' });

    // Three errors → focus lands on the FIRST invalid control.
    await userEvent.click(submit);
    await expect(await canvas.findByText('Enter your full name.')).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByLabelText('Full name')).toHaveFocus());

    // Keyboard-only from here: typing lands in the focused control; each rejected submit hops to the next invalid one.
    await userEvent.keyboard('Ada Lovelace');
    await userEvent.click(submit);
    await waitFor(() => expect(canvas.getByLabelText('Email')).toHaveFocus());

    await userEvent.keyboard('ada@example.io');
    await userEvent.click(submit);
    await waitFor(() => expect(canvas.getByLabelText('Password')).toHaveFocus());

    // All valid → submit succeeds; nothing left to focus.
    await userEvent.keyboard('open-sesame-42');
    await userEvent.click(submit);
    await expect(await canvas.findByText('Account created.')).toBeInTheDocument();
  },
};
