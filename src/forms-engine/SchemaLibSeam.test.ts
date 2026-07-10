import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { runStandardSchema } from './SchemaValidation';

/*
 * The Standard Schema seam against REAL libraries (forms-vector-next.md §F-2c) — zod 4 and
 * valibot 1.x devDeps exercised through `runStandardSchema`, pinning by test (not doc) that:
 *   - issue-path → dot-path mapping is correct for BOTH spec path shapes: zod emits plain
 *     `PropertyKey` segments (`['rules', 0, 'destination']`), valibot emits `PathSegment`
 *     objects (`[{ key: 'rules' }, { key: 0 }, { key: 'destination' }]`) — both must land
 *     on the same canonical form path (`rules[0].destination`).
 *   - sync schemas resolve synchronously (no promise tick between a change and its errors);
 *     async schemas (zod async `refine`, valibot `pipeAsync`/`checkAsync`) return a promise.
 *   - messages flow through VERBATIM — schemas own messages, the SDK never authors,
 *     rewrites, or translates them (i18n groundwork; non-English fixtures prove it).
 *
 * Engine-level proof (both adapters, rendered fields) lives in
 * `conformance/SchemaLibSeam.shared.tsx`.
 */

interface CheckoutValues {
  title: string;
  profile: { email: string };
  rules: Array<{ destination: string }>;
}

const invalidCheckout: CheckoutValues = {
  title: '',
  profile: { email: 'not-an-email' },
  rules: [{ destination: 'ok' }, { destination: '' }],
};

const validCheckout: CheckoutValues = {
  title: 'Chegirma',
  profile: { email: 'ada@example.io' },
  rules: [{ destination: 'https://a.example' }, { destination: 'https://b.example' }],
};

describe('schema-lib seam — zod 4 (plain PropertyKey issue paths)', () => {
  const checkoutSchema = z.object({
    title: z.string().min(1, 'Sarlavha majburiy'),
    profile: z.object({ email: z.string().regex(/@/, 'Email notogri') }),
    rules: z.array(z.object({ destination: z.string().min(1, 'Manzil majburiy') })),
  });

  it('maps top-level, nested, and array-element issue paths to canonical form paths', () => {
    const outcome = runStandardSchema(checkoutSchema, invalidCheckout);

    expect(outcome).not.toBeInstanceOf(Promise);
    expect(outcome).toEqual({
      title: ['Sarlavha majburiy'],
      'profile.email': ['Email notogri'],
      'rules[1].destination': ['Manzil majburiy'],
    });
  });

  it('resolves a passing sync schema to {} without a promise tick', () => {
    const outcome = runStandardSchema(checkoutSchema, validCheckout);
    expect(outcome).not.toBeInstanceOf(Promise);
    expect(outcome).toEqual({});
  });

  it('lands a cross-field refine on its declared path and a path-less refine on the root key', () => {
    const schema = z
      .object({ password: z.string(), confirm: z.string() })
      .refine((data) => data.confirm === data.password, { message: 'Parollar mos emas', path: ['confirm'] })
      .refine((data) => data.password !== 'butun-forma', 'Butun forma xato');

    expect(runStandardSchema(schema, { password: 'a', confirm: 'b' })).toEqual({
      confirm: ['Parollar mos emas'],
    });
    // Path-less issues key under '' — they hold `isValid` false without a field to render on.
    expect(runStandardSchema(schema, { password: 'butun-forma', confirm: 'butun-forma' })).toEqual({
      '': ['Butun forma xato'],
    });
  });

  it('aggregates multiple issues on one path in emit order', () => {
    const schema = z
      .object({ name: z.string() })
      .refine((data) => data.name.length >= 5, { message: 'Kamida 5 belgi', path: ['name'] })
      .refine((data) => /^[a-z]+$/.test(data.name), { message: 'Faqat kichik harflar', path: ['name'] });

    expect(runStandardSchema(schema, { name: 'AB1' })).toEqual({
      name: ['Kamida 5 belgi', 'Faqat kichik harflar'],
    });
  });

  it('returns a promise for an async refine and resolves it to the same mapped shape', async () => {
    const schema = z
      .object({ name: z.string() })
      .refine(async (data) => data.name !== 'band', { message: 'Bu nom band qilingan', path: ['name'] });

    const failing = runStandardSchema(schema, { name: 'band' });
    expect(failing).toBeInstanceOf(Promise);
    await expect(failing).resolves.toEqual({ name: ['Bu nom band qilingan'] });

    await expect(runStandardSchema(schema, { name: 'erkin' })).resolves.toEqual({});
  });
});

describe('schema-lib seam — valibot 1.x ({ key } PathSegment issue paths)', () => {
  const checkoutSchema = v.object({
    title: v.pipe(v.string(), v.minLength(1, 'Sarlavha majburiy')),
    profile: v.object({ email: v.pipe(v.string(), v.regex(/@/, 'Email notogri')) }),
    rules: v.array(v.object({ destination: v.pipe(v.string(), v.minLength(1, 'Manzil majburiy')) })),
  });

  it('maps top-level, nested, and array-element issue paths to canonical form paths', () => {
    const outcome = runStandardSchema(checkoutSchema, invalidCheckout);

    expect(outcome).not.toBeInstanceOf(Promise);
    expect(outcome).toEqual({
      title: ['Sarlavha majburiy'],
      'profile.email': ['Email notogri'],
      'rules[1].destination': ['Manzil majburiy'],
    });
  });

  it('resolves a passing sync schema to {} without a promise tick', () => {
    const outcome = runStandardSchema(checkoutSchema, validCheckout);
    expect(outcome).not.toBeInstanceOf(Promise);
    expect(outcome).toEqual({});
  });

  it('lands a forwarded cross-field check on its path and an unforwarded check on the root key', () => {
    const schema = v.pipe(
      v.object({ password: v.string(), confirm: v.string() }),
      v.forward(
        v.check((data) => data.confirm === data.password, 'Parollar mos emas'),
        ['confirm'],
      ),
      v.check((data) => data.password !== 'butun-forma', 'Butun forma xato'),
    );

    expect(runStandardSchema(schema, { password: 'a', confirm: 'b' })).toEqual({
      confirm: ['Parollar mos emas'],
    });
    expect(runStandardSchema(schema, { password: 'butun-forma', confirm: 'butun-forma' })).toEqual({
      '': ['Butun forma xato'],
    });
  });

  it('aggregates multiple issues on one path in emit order', () => {
    const schema = v.object({
      name: v.pipe(v.string(), v.minLength(5, 'Kamida 5 belgi'), v.regex(/^[a-z]+$/, 'Faqat kichik harflar')),
    });

    expect(runStandardSchema(schema, { name: 'AB1' })).toEqual({
      name: ['Kamida 5 belgi', 'Faqat kichik harflar'],
    });
  });

  it('returns a promise for a pipeAsync/checkAsync schema and resolves it to the same mapped shape', async () => {
    const schema = v.pipeAsync(
      v.objectAsync({ name: v.string() }),
      v.forwardAsync(
        v.checkAsync(async (data) => data.name !== 'band', 'Bu nom band qilingan'),
        ['name'],
      ),
    );

    const failing = runStandardSchema(schema, { name: 'band' });
    expect(failing).toBeInstanceOf(Promise);
    await expect(failing).resolves.toEqual({ name: ['Bu nom band qilingan'] });

    await expect(runStandardSchema(schema, { name: 'erkin' })).resolves.toEqual({});
  });
});
