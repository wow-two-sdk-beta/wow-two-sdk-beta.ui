import { act, render, renderHook, waitFor } from '@testing-library/react';
import * as v from 'valibot';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useFormControl, type FormControlContextValue } from '@src/foundation/primitives';

import type { AppFieldApi, AppForm, AppFormOptions, FormEngine } from '@src/forms-engine/AppForm';

/*
 * The Standard Schema seam through REAL libraries, per engine (forms-vector-next.md §F-2c).
 * The main conformance matrix (`FormEngineContract.shared.tsx`) pins behavior with hand-rolled
 * spec-shaped fixtures; this suite re-proves the representative validation cases with actual
 * zod 4 and valibot 1.x schemas (devDeps — apps bring their own copy), so the seam is pinned
 * by test against the two libs the workspace convention names: sync + async, cross-field,
 * nested paths, array element paths, and issue-path → dot-path mapping for BOTH spec path
 * shapes (zod: plain `PropertyKey` segments; valibot: `{ key }` PathSegment objects).
 *
 * MESSAGE-SLOT / i18n RULE (groundwork for the P6 LocaleProvider sweep, targets.md §2.2):
 * validation messages belong to schemas and apps — the SDK client-validation path forwards
 * `issue.message` VERBATIM into `f.errors` / `FormControlContext.errors` and never authors,
 * rewrites, translates, or falls back to English. The non-English fixtures below fail loudly
 * if any SDK layer injects its own wording. The one SDK-authored literal left on the SUBMIT
 * path is `toApiError`'s `'Unknown error'` fallback for message-less non-Error throws
 * (`SubmitErrors.ts`) — queued in §F-2c to become an overridable slot, out of scope here.
 */

interface NameValues {
  name: string;
}

interface PasswordValues {
  password: string;
  confirm: string;
}

interface CheckoutValues {
  title: string;
  profile: { email: string };
  rules: Array<{ destination: string }>;
}

/**
 * A gate the test controls: async checks stay pending until told to settle. All `check()`
 * calls between settlements share ONE promise — zod's `~standard.validate` calls the refine
 * twice per run (a sync parse attempt it abandons on discovering the async refinement, then
 * the real `safeParseAsync` pass), and both calls must observe the same settlement.
 */
function checkGate() {
  let deferred: { promise: Promise<boolean>; resolve: (ok: boolean) => void } | null = null;
  return {
    check: () => {
      if (!deferred) {
        let resolve!: (ok: boolean) => void;
        const promise = new Promise<boolean>((res) => {
          resolve = res;
        });
        deferred = { promise, resolve };
      }
      return deferred.promise;
    },
    settle: (ok: boolean) => {
      const current = deferred;
      deferred = null;
      current?.resolve(ok);
    },
  };
}

/** Runs the real-lib validation matrix against one adapter's `useAppForm`. */
export function describeSchemaLibSeam(engineName: string, useAppForm: FormEngine['useAppForm']): void {
  /** Renders a form plus probes: a full-state reader and lazily-mounted per-field API captors. */
  function renderForm<TValues extends object>(options: AppFormOptions<TValues>) {
    const hook = renderHook(() => useAppForm<TValues>(options));
    const form: AppForm<TValues> = hook.result.current;
    const stateProbe = renderHook(() => form.useFormState((state) => state));
    const readState = () => stateProbe.result.current;

    const captors = new Map<string, { current: AppFieldApi<unknown> }>();
    /** Mounts a `form.Field` captor. Call at the test's top level, NEVER first inside `act()`. */
    const field = (name: string): { current: AppFieldApi<unknown> } => {
      const existing = captors.get(name);
      if (existing) return existing;
      const captor = { current: null as unknown as AppFieldApi<unknown> };
      render(
        <form.Field name={name}>
          {(api) => {
            captor.current = api as AppFieldApi<unknown>;
            return null;
          }}
        </form.Field>,
      );
      captors.set(name, captor);
      return captor;
    };

    return { form, readState, field };
  }

  const checkoutDefaults: CheckoutValues = {
    title: '',
    profile: { email: 'not-an-email' },
    rules: [{ destination: 'ok' }, { destination: '' }],
  };

  describe(`schema-lib seam — ${engineName}`, () => {
    describe('zod 4', () => {
      const nameSchema = z.object({ name: z.string().min(1, 'Nomi majburiy') });

      const checkoutSchema = z.object({
        title: z.string().min(1, 'Sarlavha majburiy'),
        profile: z.object({ email: z.string().regex(/@/, 'Email notogri') }),
        rules: z.array(z.object({ destination: z.string().min(1, 'Manzil majburiy') })),
      });

      it('surfaces the schema message verbatim on change-validation and clears on fix', async () => {
        const { readState, field } = renderForm<NameValues>({
          defaultValues: { name: 'ada' },
          schema: nameSchema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue(''));
        await waitFor(() => expect(name.current.errors).toEqual(['Nomi majburiy']));
        expect(readState().isValid).toBe(false);

        await act(async () => name.current.setValue('grace'));
        await waitFor(() => expect(name.current.errors).toEqual([]));
        expect(readState().isValid).toBe(true);
      });

      it('lands nested and array-element issue paths on their fields and blocks onSubmit', async () => {
        const onSubmit = vi.fn(async () => null);
        const { form, field } = renderForm<CheckoutValues>({
          defaultValues: checkoutDefaults,
          schema: checkoutSchema,
          onSubmit,
        });
        const title = field('title');
        const email = field('profile.email');
        const okRow = field('rules[0].destination');
        const badRow = field('rules[1].destination');

        await act(async () => form.handleSubmit());
        expect(onSubmit).not.toHaveBeenCalled();
        await waitFor(() => expect(title.current.errors).toEqual(['Sarlavha majburiy']));
        expect(email.current.errors).toEqual(['Email notogri']);
        expect(badRow.current.errors).toEqual(['Manzil majburiy']);
        expect(okRow.current.errors).toEqual([]);
      });

      it('lands a cross-field refine on its declared path', async () => {
        const schema = z
          .object({ password: z.string(), confirm: z.string() })
          .refine((data) => data.confirm === data.password, { message: 'Parollar mos emas', path: ['confirm'] });
        const { field } = renderForm<PasswordValues>({
          defaultValues: { password: 'sirli-soz', confirm: '' },
          schema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const password = field('password');
        const confirm = field('confirm');

        await act(async () => confirm.current.setValue('boshqa'));
        await waitFor(() => expect(confirm.current.errors).toEqual(['Parollar mos emas']));
        expect(password.current.errors).toEqual([]);

        await act(async () => confirm.current.setValue('sirli-soz'));
        await waitFor(() => expect(confirm.current.errors).toEqual([]));
      });

      it('holds isValid false on a path-less (root) refine without inventing a field error', async () => {
        const onSubmit = vi.fn(async () => null);
        const schema = z
          .object({ name: z.string() })
          .refine((data) => data.name !== 'butun-forma', 'Butun forma xato');
        const { form, readState, field } = renderForm<NameValues>({
          defaultValues: { name: 'butun-forma' },
          schema,
          onSubmit,
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(onSubmit).not.toHaveBeenCalled();
        await waitFor(() => expect(readState().isValid).toBe(false));
        expect(name.current.errors).toEqual([]);
      });

      it('aggregates multiple issues on one path in emit order', async () => {
        const schema = z
          .object({ name: z.string() })
          .refine((data) => data.name.length >= 5, { message: 'Kamida 5 belgi', path: ['name'] })
          .refine((data) => /^[a-z]+$/.test(data.name), { message: 'Faqat kichik harflar', path: ['name'] });
        const { form, field } = renderForm<NameValues>({
          defaultValues: { name: 'AB1' },
          schema,
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        await waitFor(() => expect(name.current.errors).toEqual(['Kamida 5 belgi', 'Faqat kichik harflar']));
      });

      it('flags isValidating while an async refine is pending, then applies its message', async () => {
        const gate = checkGate();
        const schema = z
          .object({ name: z.string() })
          .refine(() => gate.check(), { message: 'Bu nom band qilingan', path: ['name'] });
        const { readState, field } = renderForm<NameValues>({
          defaultValues: { name: '' },
          schema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue('band'));
        await waitFor(() => expect(readState().isValidating).toBe(true));

        await act(async () => gate.settle(false));
        await waitFor(() => expect(name.current.errors).toEqual(['Bu nom band qilingan']));
        expect(readState().isValidating).toBe(false);
      });

      it('submit awaits an async refine and blocks onSubmit when it fails', async () => {
        const onSubmit = vi.fn(async () => null);
        const schema = z
          .object({ name: z.string() })
          .refine(async (data) => data.name !== 'band', { message: 'Bu nom band qilingan', path: ['name'] });
        const { form, field } = renderForm<NameValues>({
          defaultValues: { name: 'band' },
          schema,
          onSubmit,
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(onSubmit).not.toHaveBeenCalled();
        await waitFor(() => expect(name.current.errors).toEqual(['Bu nom band qilingan']));

        await act(async () => name.current.setValue('erkin'));
        await act(async () => form.handleSubmit());
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      });
    });

    describe('valibot 1.x', () => {
      const nameSchema = v.object({ name: v.pipe(v.string(), v.minLength(1, 'Nomi majburiy')) });

      const checkoutSchema = v.object({
        title: v.pipe(v.string(), v.minLength(1, 'Sarlavha majburiy')),
        profile: v.object({ email: v.pipe(v.string(), v.regex(/@/, 'Email notogri')) }),
        rules: v.array(v.object({ destination: v.pipe(v.string(), v.minLength(1, 'Manzil majburiy')) })),
      });

      it('surfaces the schema message verbatim on change-validation and clears on fix', async () => {
        const { readState, field } = renderForm<NameValues>({
          defaultValues: { name: 'ada' },
          schema: nameSchema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue(''));
        await waitFor(() => expect(name.current.errors).toEqual(['Nomi majburiy']));
        expect(readState().isValid).toBe(false);

        await act(async () => name.current.setValue('grace'));
        await waitFor(() => expect(name.current.errors).toEqual([]));
        expect(readState().isValid).toBe(true);
      });

      it('lands nested and array-element issue paths on their fields and blocks onSubmit', async () => {
        const onSubmit = vi.fn(async () => null);
        const { form, field } = renderForm<CheckoutValues>({
          defaultValues: checkoutDefaults,
          schema: checkoutSchema,
          onSubmit,
        });
        const title = field('title');
        const email = field('profile.email');
        const okRow = field('rules[0].destination');
        const badRow = field('rules[1].destination');

        await act(async () => form.handleSubmit());
        expect(onSubmit).not.toHaveBeenCalled();
        await waitFor(() => expect(title.current.errors).toEqual(['Sarlavha majburiy']));
        expect(email.current.errors).toEqual(['Email notogri']);
        expect(badRow.current.errors).toEqual(['Manzil majburiy']);
        expect(okRow.current.errors).toEqual([]);
      });

      it('lands a forwarded cross-field check on its declared path', async () => {
        const schema = v.pipe(
          v.object({ password: v.string(), confirm: v.string() }),
          v.forward(
            v.check((data) => data.confirm === data.password, 'Parollar mos emas'),
            ['confirm'],
          ),
        );
        const { field } = renderForm<PasswordValues>({
          defaultValues: { password: 'sirli-soz', confirm: '' },
          schema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const password = field('password');
        const confirm = field('confirm');

        await act(async () => confirm.current.setValue('boshqa'));
        await waitFor(() => expect(confirm.current.errors).toEqual(['Parollar mos emas']));
        expect(password.current.errors).toEqual([]);

        await act(async () => confirm.current.setValue('sirli-soz'));
        await waitFor(() => expect(confirm.current.errors).toEqual([]));
      });

      it('holds isValid false on an unforwarded (root) check without inventing a field error', async () => {
        const onSubmit = vi.fn(async () => null);
        const schema = v.pipe(
          v.object({ name: v.string() }),
          v.check((data) => data.name !== 'butun-forma', 'Butun forma xato'),
        );
        const { form, readState, field } = renderForm<NameValues>({
          defaultValues: { name: 'butun-forma' },
          schema,
          onSubmit,
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(onSubmit).not.toHaveBeenCalled();
        await waitFor(() => expect(readState().isValid).toBe(false));
        expect(name.current.errors).toEqual([]);
      });

      it('aggregates multiple issues on one path in emit order', async () => {
        const schema = v.object({
          name: v.pipe(v.string(), v.minLength(5, 'Kamida 5 belgi'), v.regex(/^[a-z]+$/, 'Faqat kichik harflar')),
        });
        const { form, field } = renderForm<NameValues>({
          defaultValues: { name: 'AB1' },
          schema,
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        await waitFor(() => expect(name.current.errors).toEqual(['Kamida 5 belgi', 'Faqat kichik harflar']));
      });

      it('flags isValidating while an async check is pending, then applies its message', async () => {
        const gate = checkGate();
        const schema = v.pipeAsync(
          v.objectAsync({ name: v.string() }),
          v.forwardAsync(
            v.checkAsync(() => gate.check(), 'Bu nom band qilingan'),
            ['name'],
          ),
        );
        const { readState, field } = renderForm<NameValues>({
          defaultValues: { name: '' },
          schema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue('band'));
        await waitFor(() => expect(readState().isValidating).toBe(true));

        await act(async () => gate.settle(false));
        await waitFor(() => expect(name.current.errors).toEqual(['Bu nom band qilingan']));
        expect(readState().isValidating).toBe(false);
      });

      it('submit awaits an async check and blocks onSubmit when it fails', async () => {
        const onSubmit = vi.fn(async () => null);
        const schema = v.pipeAsync(
          v.objectAsync({ name: v.string() }),
          v.forwardAsync(
            v.checkAsync(async (data) => data.name !== 'band', 'Bu nom band qilingan'),
            ['name'],
          ),
        );
        const { form, field } = renderForm<NameValues>({
          defaultValues: { name: 'band' },
          schema,
          onSubmit,
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(onSubmit).not.toHaveBeenCalled();
        await waitFor(() => expect(name.current.errors).toEqual(['Bu nom band qilingan']));

        await act(async () => name.current.setValue('erkin'));
        await act(async () => form.handleSubmit());
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      });
    });

    describe('message slot (i18n groundwork)', () => {
      it('forwards schema + server messages verbatim through f.errors and FormControlContext — no SDK-authored wording', async () => {
        // One real-lib schema message plus a server overlay, both non-English: the full
        // error surface (field API + chrome context) must carry them byte-for-byte,
        // client first — the SDK never authors, rewrites, or translates a message.
        const schema = z.object({ name: z.string().min(1, "Ismingizni kiriting, iltimos") });
        const { form, field } = renderForm<NameValues>({
          defaultValues: { name: 'ada' },
          schema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');
        const seen: { current: FormControlContextValue | null } = { current: null };
        function ContextProbe() {
          seen.current = useFormControl();
          return null;
        }
        render(<form.Field name="name">{() => <ContextProbe />}</form.Field>);

        await act(async () => name.current.setValue(''));
        await waitFor(() => expect(name.current.errors).toEqual(["Ismingizni kiriting, iltimos"]));

        await act(async () => form.setFieldErrors({ name: ["Bu ism allaqachon band"] }));
        await waitFor(() =>
          expect(name.current.errors).toEqual(["Ismingizni kiriting, iltimos", "Bu ism allaqachon band"]),
        );
        expect(seen.current?.errors).toEqual(["Ismingizni kiriting, iltimos", "Bu ism allaqachon band"]);
      });

      it('forwards a valibot message verbatim into f.errors', async () => {
        const schema = v.object({
          name: v.pipe(v.string(), v.minLength(1, "So'rov matni bo'sh bo'lishi mumkin emas")),
        });
        const { field } = renderForm<NameValues>({
          defaultValues: { name: 'ada' },
          schema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue(''));
        await waitFor(() => expect(name.current.errors).toEqual(["So'rov matni bo'sh bo'lishi mumkin emas"]));
      });
    });
  });
}
