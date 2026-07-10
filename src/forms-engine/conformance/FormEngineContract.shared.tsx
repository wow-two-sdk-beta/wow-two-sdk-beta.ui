import { act, render, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../foundation/http';
import {
  useFormControl,
  useFormControlChrome,
  type FormControlChromeKind,
  type FormControlContextValue,
} from '../../foundation/primitives';

import type { AppFieldApi, AppForm, AppFormOptions, FormEngine } from '../AppForm';
import type { StandardSchemaV1 } from '../StandardSchema';

/*
 * The engine conformance suite — the anti-LCD instrument (docs/analysis/forms-engine.md §5).
 * One behavioral matrix (R1–R13: validateOn timing, error merge/precedence, server-error
 * clearing, array ops, reset semantics, dirty tracking, submit pipeline) executed against
 * EVERY adapter via its `useAppForm`. An adapter is done when this suite is green; a
 * contract change without a green matrix doesn't ship. This pins semantics, not just
 * signatures — the difference between "two engines" and "two behaviors".
 *
 * Runs in the vitest `browser` project (renderHook against real chromium). Phase 2 adds a
 * second runner file for the tanstack adapter over this same suite.
 */

/** A promise plus its resolve/reject handles (query-test harness pattern). */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Builds a synchronous Standard Schema from an issue-producing check — spec-shaped, no schema lib. */
function schemaOf<TValues extends object>(
  check: (values: TValues) => StandardSchemaV1.Issue[],
): StandardSchemaV1<TValues> {
  return {
    '~standard': {
      version: 1,
      vendor: 'conformance',
      validate: (value) => {
        const issues = check(value as TValues);
        return issues.length > 0 ? { issues } : { value: value as TValues };
      },
    },
  };
}

/** Wraps a sync check into an always-async Standard Schema (resolves on a microtask). */
function asyncSchemaOf<TValues extends object>(
  check: (values: TValues) => StandardSchemaV1.Issue[],
): StandardSchemaV1<TValues> {
  const sync = schemaOf(check);
  return {
    '~standard': {
      version: 1,
      vendor: 'conformance',
      validate: (value) => Promise.resolve(sync['~standard'].validate(value)),
    },
  };
}

/** An async Standard Schema whose pending validations resolve only when the test says so. */
function gatedSchema<TValues extends object>() {
  const pending: Array<(result: StandardSchemaV1.Result<TValues>) => void> = [];
  const schema: StandardSchemaV1<TValues> = {
    '~standard': {
      version: 1,
      vendor: 'conformance',
      validate: () => new Promise<StandardSchemaV1.Result<TValues>>((resolve) => pending.push(resolve)),
    },
  };
  return {
    schema,
    pendingCount: () => pending.length,
    resolveOldest: (result: StandardSchemaV1.Result<TValues>) => pending.shift()?.(result),
  };
}

interface LoginValues {
  name: string;
  email: string;
}

const loginDefaults: LoginValues = { name: '', email: '' };

/** `name` required — the workhorse schema; issue path uses a plain key. */
const nameRequired = () =>
  schemaOf<LoginValues>((values) =>
    values.name.trim() === '' ? [{ message: 'Name is required', path: ['name'] }] : [],
  );

interface RuleRow {
  destination: string;
}

interface RulesValues {
  title: string;
  rules: RuleRow[];
}

/** Runs the full behavioral conformance matrix against one adapter's `useAppForm`. */
export function describeFormEngineConformance(engineName: string, useAppForm: FormEngine['useAppForm']): void {
  /** Renders a form plus probes: a full-state reader and lazily-mounted per-field API captors. */
  function renderForm<TValues extends object>(options: AppFormOptions<TValues>) {
    const hook = renderHook(() => useAppForm<TValues>(options));
    const form: AppForm<TValues> = hook.result.current;
    const stateProbe = renderHook(() => form.useFormState((state) => state));
    const readState = () => stateProbe.result.current;

    const captors = new Map<string, { current: AppFieldApi<unknown> }>();
    /** Mounts a `form.Field` captor. Call at the test's top level, NEVER first inside `act()` — the mount flush defers to act exit and the captor reads null. */
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

  describe(`form engine conformance — ${engineName}`, () => {
    describe('field state model', () => {
      it('seeds defaultValues and starts clean', () => {
        const { readState, field } = renderForm<LoginValues>({
          defaultValues: { name: 'ada', email: 'ada@ex.io' },
          onSubmit: async () => null,
        });

        expect(readState().values).toEqual({ name: 'ada', email: 'ada@ex.io' });
        expect(readState().isDirty).toBe(false);
        expect(readState().isValid).toBe(true);
        expect(readState().isSubmitting).toBe(false);
        expect(readState().isValidating).toBe(false);
        expect(readState().submitError).toBeNull();

        const name = field('name');
        expect(name.current.value).toBe('ada');
        expect(name.current.errors).toEqual([]);
        expect(name.current.isDirty).toBe(false);
        expect(name.current.isTouched).toBe(false);
      });

      it('setValue updates the value and tracks dirty against the baseline', async () => {
        const { readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue('ada'));
        expect(name.current.value).toBe('ada');
        expect(name.current.isDirty).toBe(true);
        expect(readState().isDirty).toBe(true);
        expect(readState().values.name).toBe('ada');

        // Reverting to the default is clean again — dirty is baseline-compared, not "was changed".
        await act(async () => name.current.setValue(''));
        expect(name.current.isDirty).toBe(false);
        expect(readState().isDirty).toBe(false);
      });

      it('onBlur marks the field touched', async () => {
        const { field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const name = field('name');

        expect(name.current.isTouched).toBe(false);
        await act(async () => name.current.onBlur());
        expect(name.current.isTouched).toBe(true);
      });

      it('reads and writes nested + array-row paths (R9)', async () => {
        const { readState, field } = renderForm<RulesValues>({
          defaultValues: { title: '', rules: [{ destination: 'a' }, { destination: 'b' }] },
          onSubmit: async () => null,
        });
        const row = field('rules[1].destination');

        expect(row.current.value).toBe('b');
        await act(async () => row.current.setValue('c'));
        expect(readState().values.rules).toEqual([{ destination: 'a' }, { destination: 'c' }]);
        expect(row.current.isDirty).toBe(true);
      });
    });

    describe('validateOn timing', () => {
      it("'change' validates on every change and clears on fix", async () => {
        const { readState, field } = renderForm<LoginValues>({
          defaultValues: { name: 'ada', email: '' },
          schema: nameRequired(),
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue(''));
        await waitFor(() => expect(name.current.errors).toEqual(['Name is required']));
        expect(readState().isValid).toBe(false);

        await act(async () => name.current.setValue('grace'));
        await waitFor(() => expect(name.current.errors).toEqual([]));
        expect(readState().isValid).toBe(true);
      });

      it("'blur' stays silent on change and validates on blur", async () => {
        const { field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: nameRequired(),
          validateOn: 'blur',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue(''));
        expect(name.current.errors).toEqual([]);

        await act(async () => name.current.onBlur());
        await waitFor(() => expect(name.current.errors).toEqual(['Name is required']));
      });

      it("'submit' (default) stays silent until the first attempt, then re-validates on change", async () => {
        const onSubmit = vi.fn(async () => null);
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: nameRequired(),
          onSubmit,
        });
        const name = field('name');

        // Pre-attempt: neither change nor blur surfaces errors.
        await act(async () => name.current.setValue(''));
        await act(async () => name.current.onBlur());
        expect(name.current.errors).toEqual([]);

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Name is required']);
        expect(onSubmit).not.toHaveBeenCalled();

        // Post-attempt: fixing the field clears its error without another submit.
        await act(async () => name.current.setValue('grace'));
        await waitFor(() => expect(name.current.errors).toEqual([]));
      });
    });

    describe('submit pipeline', () => {
      it('submits valid values and toggles isSubmitting around the async call', async () => {
        const gate = deferred<null>();
        const onSubmit = vi.fn(() => gate.promise);
        const { form, readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit,
        });
        const name = field('name');
        await act(async () => name.current.setValue('ada'));

        let submitPromise!: Promise<void>;
        act(() => {
          submitPromise = form.handleSubmit();
        });
        await waitFor(() => expect(readState().isSubmitting).toBe(true));
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({ name: 'ada', email: '' });

        await act(async () => {
          gate.resolve(null);
          await submitPromise;
        });
        expect(readState().isSubmitting).toBe(false);
        expect(readState().submitError).toBeNull();
      });

      it('resolves (never rejects) when onSubmit throws', async () => {
        const { form, readState } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new Error('boom');
          },
        });

        await act(async () => {
          await expect(form.handleSubmit()).resolves.toBeUndefined();
        });
        expect(readState().isSubmitting).toBe(false);
        expect(readState().submitError).not.toBeNull();
      });

      it('lands ASP.NET ValidationProblemDetails dict errors on fields, camelCased (R5)', async () => {
        const { form, readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new ApiError(400, {
              title: 'Validation failed',
              errors: { Name: ['Name is taken'], Email: ['Email is invalid'] },
            });
          },
        });
        const name = field('name');
        const email = field('email');

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Name is taken']);
        expect(email.current.errors).toEqual(['Email is invalid']);
        // Fully represented on fields — nothing left for the form-level alert.
        expect(readState().submitError).toBeNull();
        expect(readState().isValid).toBe(false);
      });

      it('lands the wow-two `[{ property, message }]` error shape on fields (R5)', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new ApiError(400, {
              title: 'Validation failed',
              errors: [
                { property: 'Name', message: 'Too short' },
                { property: 'Name', message: 'No digits allowed' },
              ],
            });
          },
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Too short', 'No digits allowed']);
      });

      it('maps array-row server paths onto row fields (`Rules[0].Destination` → `rules[0].destination`)', async () => {
        const { form, readState, field } = renderForm<RulesValues>({
          defaultValues: { title: '', rules: [{ destination: '' }] },
          onSubmit: async () => {
            throw new ApiError(400, { errors: { 'Rules[0].Destination': ['Invalid URL'] } });
          },
        });
        const row = field('rules[0].destination');

        await act(async () => form.handleSubmit());
        expect(row.current.errors).toEqual(['Invalid URL']);
        expect(readState().submitError).toBeNull();
      });

      it('feeds a failure whose mapped paths match no field into submitError', async () => {
        const failure = new ApiError(409, { title: 'Conflict', errors: { SomethingElse: ['nope'] } });
        const { form, readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw failure;
          },
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(readState().submitError).toBe(failure);
        expect(name.current.errors).toEqual([]);
      });

      it('on a partial match, lands matches on fields and keeps the failure in submitError', async () => {
        const { form, readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new ApiError(400, { errors: { Name: ['Taken'], Ghost: ['unplaced'] } });
          },
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Taken']);
        expect(readState().submitError).not.toBeNull();
      });

      it('coerces a non-ApiError throw into an ApiError submitError (message preserved)', async () => {
        const { form, readState } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new Error('network down');
          },
        });

        await act(async () => form.handleSubmit());
        const submitError = readState().submitError;
        expect(submitError).toBeInstanceOf(ApiError);
        expect(submitError?.message).toBe('network down');
      });

      it('honors a custom mapSubmitError', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new Error('opaque');
          },
          mapSubmitError: () => ({ name: ['Mapped by hand'] }),
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Mapped by hand']);
      });

      it('honors a custom mapFieldPath', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new ApiError(400, { errors: { 'Dto.Name': ['Nested server path'] } });
          },
          mapFieldPath: (serverPath) => serverPath.replace(/^Dto\./, '').toLowerCase(),
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Nested server path']);
      });

      it('a new submit attempt clears the previous server errors and submitError', async () => {
        let failures = 0;
        const { form, readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            failures += 1;
            if (failures === 1) throw new ApiError(400, { errors: { Name: ['Taken'], Ghost: ['x'] } });
            return null;
          },
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Taken']);
        expect(readState().submitError).not.toBeNull();

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual([]);
        expect(readState().submitError).toBeNull();
      });

      it('server errors clear on the next change to that field only', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => {
            throw new ApiError(400, { errors: { Name: ['Taken'], Email: ['Invalid'] } });
          },
        });
        const name = field('name');
        const email = field('email');

        await act(async () => form.handleSubmit());
        expect(name.current.errors).toEqual(['Taken']);
        expect(email.current.errors).toEqual(['Invalid']);

        await act(async () => name.current.setValue('grace'));
        await waitFor(() => expect(name.current.errors).toEqual([]));
        expect(email.current.errors).toEqual(['Invalid']);
      });
    });

    describe('error merge', () => {
      it('merges client + server messages, client first', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: nameRequired(),
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        // Client error via change-validation, then a server overlay on the same field.
        await act(async () => name.current.setValue(''));
        await waitFor(() => expect(name.current.errors).toEqual(['Name is required']));
        await act(async () => form.setFieldErrors({ name: ['Server says no'] }));

        expect(name.current.errors).toEqual(['Name is required', 'Server says no']);
      });
    });

    describe('setFieldErrors', () => {
      it('applies server errors outside the submit pipeline and clears them on change', async () => {
        const { form, readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => form.setFieldErrors({ name: ['Deferred backend check'] }));
        expect(name.current.errors).toEqual(['Deferred backend check']);
        expect(readState().isValid).toBe(false);

        await act(async () => name.current.setValue('grace'));
        expect(name.current.errors).toEqual([]);
        expect(readState().isValid).toBe(true);
      });
    });

    describe('reset', () => {
      it('reset() restores defaults and clears errors, touched, dirty, and submitError', async () => {
        const { form, readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: nameRequired(),
          onSubmit: async () => {
            throw new ApiError(400, { errors: { Email: ['Invalid'] } });
          },
        });
        const name = field('name');
        const email = field('email');

        await act(async () => name.current.setValue('ada'));
        await act(async () => name.current.onBlur());
        await act(async () => form.handleSubmit());
        expect(email.current.errors).toEqual(['Invalid']);

        await act(async () => form.reset());
        expect(readState().values).toEqual(loginDefaults);
        expect(readState().isDirty).toBe(false);
        expect(readState().isValid).toBe(true);
        expect(readState().submitError).toBeNull();
        expect(name.current.value).toBe('');
        expect(name.current.isTouched).toBe(false);
        expect(email.current.errors).toEqual([]);
      });

      it('reset(next) re-seeds values AND the dirty baseline (edit-mode prefill, R6)', async () => {
        const loaded: LoginValues = { name: 'ada', email: 'ada@ex.io' };
        const { readState, form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => form.reset(loaded));
        expect(readState().values).toEqual(loaded);
        expect(readState().isDirty).toBe(false);
        expect(name.current.isDirty).toBe(false);

        // Dirty now compares against the loaded entity, not the original defaults.
        await act(async () => name.current.setValue('grace'));
        expect(name.current.isDirty).toBe(true);
        await act(async () => name.current.setValue('ada'));
        expect(name.current.isDirty).toBe(false);
      });
    });

    describe('array operations (R8)', () => {
      const rowsOf = (state: { values: RulesValues }) => state.values.rules.map((rule) => rule.destination);

      it('push and insert add rows in order', async () => {
        const { form, readState } = renderForm<RulesValues>({
          defaultValues: { title: '', rules: [{ destination: 'a' }] },
          onSubmit: async () => null,
        });

        await act(async () => form.array('rules').push({ destination: 'b' }));
        await act(async () => form.array('rules').insert(1, { destination: 'between' }));
        expect(rowsOf(readState())).toEqual(['a', 'between', 'b']);
      });

      it('remove, swap, and move reorder rows', async () => {
        const { form, readState } = renderForm<RulesValues>({
          defaultValues: { title: '', rules: [{ destination: 'a' }, { destination: 'b' }, { destination: 'c' }, { destination: 'd' }] },
          onSubmit: async () => null,
        });
        const rules = form.array('rules');

        await act(async () => rules.remove(3));
        expect(rowsOf(readState())).toEqual(['a', 'b', 'c']);
        await act(async () => rules.swap(0, 2));
        expect(rowsOf(readState())).toEqual(['c', 'b', 'a']);
        await act(async () => rules.move(2, 0));
        expect(rowsOf(readState())).toEqual(['a', 'c', 'b']);
      });

      it('array ops drive dirty tracking', async () => {
        const { form, readState } = renderForm<RulesValues>({
          defaultValues: { title: '', rules: [{ destination: 'a' }] },
          onSubmit: async () => null,
        });

        await act(async () => form.array('rules').push({ destination: 'b' }));
        expect(readState().isDirty).toBe(true);
        await act(async () => form.array('rules').remove(1));
        expect(readState().isDirty).toBe(false);
      });

      it('row-scoped server errors follow their rows through remove', async () => {
        const { form, field } = renderForm<RulesValues>({
          defaultValues: { title: '', rules: [{ destination: 'a' }, { destination: 'b' }] },
          onSubmit: async () => null,
        });
        const firstRow = field('rules[0].destination');

        await act(async () => form.setFieldErrors({ 'rules[1].destination': ['Bad destination'] }));
        expect(firstRow.current.errors).toEqual([]);

        await act(async () => form.array('rules').remove(0));
        // Row b shifted into index 0 — its error came along.
        expect(firstRow.current.value).toBe('b');
        expect(firstRow.current.errors).toEqual(['Bad destination']);
      });
    });

    describe('subscription (R10)', () => {
      it('Subscribe renders the selected slice and updates with it', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const name = field('name');
        const seen: boolean[] = [];
        render(
          <form.Subscribe selector={(state) => state.isDirty}>
            {(isDirty) => {
              seen.push(isDirty);
              return <span data-testid="dirty">{String(isDirty)}</span>;
            }}
          </form.Subscribe>,
        );
        expect(seen.at(-1)).toBe(false);

        await act(async () => name.current.setValue('ada'));
        await waitFor(() => expect(seen.at(-1)).toBe(true));
      });

      it('an unrelated slice subscriber does not re-render on another field change', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const name = field('name');
        let renders = 0;
        render(
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => {
              renders += 1;
              return <span>{String(isSubmitting)}</span>;
            }}
          </form.Subscribe>,
        );
        const before = renders;

        await act(async () => name.current.setValue('ada'));
        expect(renders).toBe(before);
      });

      it('useFormState exposes the same selector subscription as a hook', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const name = field('name');
        const probe = renderHook(() => form.useFormState((state) => state.values.name));

        expect(probe.result.current).toBe('');
        await act(async () => name.current.setValue('ada'));
        await waitFor(() => expect(probe.result.current).toBe('ada'));
      });
    });

    describe('Field component', () => {
      it('provides FormControlContext with isInvalid + per-mode flags wired (R12)', async () => {
        const { form } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: nameRequired(),
          onSubmit: async () => null,
        });
        const seen: { current: FormControlContextValue | null } = { current: null };
        function ContextProbe() {
          seen.current = useFormControl();
          return null;
        }
        render(
          <form.Field name="name" isDisabled isRequired>
            {() => <ContextProbe />}
          </form.Field>,
        );

        expect(seen.current).not.toBeNull();
        expect(seen.current?.id).toBeTruthy();
        expect(seen.current?.errorId).toBeTruthy();
        expect(seen.current?.isDisabled).toBe(true);
        expect(seen.current?.isRequired).toBe(true);
        expect(seen.current?.isInvalid).toBe(false);

        await act(async () => form.handleSubmit());
        await waitFor(() => expect(seen.current?.isInvalid).toBe(true));
      });

      it('a submit attempt marks fields touched (error-display gating works post-attempt)', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: nameRequired(),
          onSubmit: async () => null,
        });
        const name = field('name');
        expect(name.current.isTouched).toBe(false);

        await act(async () => form.handleSubmit());
        expect(name.current.isTouched).toBe(true);
      });

      it('exposes the merged field errors on FormControlContext for chrome to render', async () => {
        const { form, field } = renderForm<LoginValues>({
          defaultValues: { name: 'ada', email: '' },
          schema: nameRequired(),
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
        expect(seen.current?.errors).toEqual([]);

        // Client error via change-validation, then a server overlay — chrome sees the merge, client first.
        await act(async () => name.current.setValue(''));
        await waitFor(() => expect(seen.current?.errors).toEqual(['Name is required']));
        await act(async () => form.setFieldErrors({ name: ['Server says no'] }));
        await waitFor(() =>
          expect(seen.current?.errors).toEqual(['Name is required', 'Server says no']),
        );
        expect(seen.current?.isInvalid).toBe(true);

        await act(async () => name.current.setValue('grace'));
        await waitFor(() => expect(seen.current?.errors).toEqual([]));
      });

      it('describedBy/labelledBy reference only registered (actually rendered) chrome', async () => {
        const { form } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          onSubmit: async () => null,
        });
        const seen: { current: FormControlContextValue | null } = { current: null };
        function ChromeProbe({ kinds }: { kinds: FormControlChromeKind[] }) {
          seen.current = useFormControl();
          useFormControlChrome('label', kinds.includes('label'));
          useFormControlChrome('helper', kinds.includes('helper'));
          useFormControlChrome('error', kinds.includes('error'));
          return null;
        }
        const view = render(<form.Field name="name">{() => <ChromeProbe kinds={[]} />}</form.Field>);

        // Nothing rendered → nothing referenced (the dangling-describedby fix).
        expect(seen.current?.describedBy).toBeUndefined();
        expect(seen.current?.labelledBy).toBeUndefined();

        view.rerender(
          <form.Field name="name">{() => <ChromeProbe kinds={['label', 'helper', 'error']} />}</form.Field>,
        );
        await waitFor(() =>
          expect(seen.current?.describedBy).toBe(`${seen.current?.helperId} ${seen.current?.errorId}`),
        );
        expect(seen.current?.labelledBy).toBe(seen.current?.labelId);

        view.rerender(<form.Field name="name">{() => <ChromeProbe kinds={['helper']} />}</form.Field>);
        await waitFor(() => expect(seen.current?.describedBy).toBe(seen.current?.helperId));
        expect(seen.current?.labelledBy).toBeUndefined();
      });
    });

    describe('async schema', () => {
      it('flags isValidating while an async validation is pending, then applies its errors', async () => {
        const gate = gatedSchema<LoginValues>();
        const { readState, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: gate.schema,
          validateOn: 'change',
          onSubmit: async () => null,
        });
        const name = field('name');

        await act(async () => name.current.setValue('x'));
        await waitFor(() => expect(readState().isValidating).toBe(true));

        await act(async () =>
          gate.resolveOldest({ issues: [{ message: 'Async says no', path: ['name'] }] }),
        );
        await waitFor(() => expect(name.current.errors).toEqual(['Async says no']));
        expect(readState().isValidating).toBe(false);
      });

      it('submit awaits async validation and blocks onSubmit when invalid', async () => {
        const onSubmit = vi.fn(async () => null);
        const { form, field } = renderForm<LoginValues>({
          defaultValues: loginDefaults,
          schema: asyncSchemaOf<LoginValues>((values) =>
            values.name.trim() === '' ? [{ message: 'Name is required', path: [{ key: 'name' }] }] : [],
          ),
          onSubmit,
        });
        const name = field('name');

        await act(async () => form.handleSubmit());
        expect(onSubmit).not.toHaveBeenCalled();
        await waitFor(() => expect(name.current.errors).toEqual(['Name is required']));

        await act(async () => name.current.setValue('ada'));
        await act(async () => form.handleSubmit());
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      });
    });
  });
}
