import { QueryClient } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

import { defineEndpoint, type Endpoint, type EndpointFn } from './Endpoints';
import { useAppLazyQuery, type UseAppLazyQueryOptions } from './UseAppLazyQuery';
import { useAppQueries } from './UseAppQueries';
import { useAppQuery, type UseAppQueryOptions } from './UseAppQuery';
import { useAppSuspenseQuery, type AppSuspenseQueryOptions } from './UseAppSuspenseQuery';
import type { PrefetchTarget } from './UsePrefetchQuery';
import type { QueryCachePrefetch } from './UseQueryCache';

/** The raw DTO shape the fake endpoints below fetch. */
interface CodeDto {
  readonly id: string;
  readonly hits: number;
}

const listDto: CodeDto[] = [{ id: 'a', hits: 3 }];

/** A fixed no-arg endpoint def, declared the way an app factory would. */
const listCodes = defineEndpoint({
  key: ['codes', 'list'] as const,
  queryFn: async (): Promise<CodeDto[]> => listDto,
});

/** A parameterized endpoint factory — the `(args) => def` shape. */
const codeDetail = (id: string) =>
  defineEndpoint({
    key: ['codes', id] as const,
    queryFn: async (): Promise<CodeDto> => ({ id, hits: 0 }),
  });

describe('defineEndpoint', () => {
  it('is a pure typing helper — returns the def unchanged', () => {
    const raw = { key: ['codes'], queryFn: async (): Promise<CodeDto[]> => listDto };

    const def = defineEndpoint(raw);

    expect(def).toBe(raw);
    expect(def.key).toEqual(['codes']);
    expect(def.queryFn).toBe(raw.queryFn);
  });

  it('keeps the key ↔ fetcher pairing per factory call', async () => {
    const a = codeDetail('a');
    const b = codeDetail('b');

    expect(a.key).toEqual(['codes', 'a']);
    expect(b.key).toEqual(['codes', 'b']);
    await expect(a.queryFn({ signal: new AbortController().signal })).resolves.toEqual({ id: 'a', hits: 0 });
    await expect(b.queryFn({ signal: new AbortController().signal })).resolves.toEqual({ id: 'b', hits: 0 });
  });

  it('feeds a plain QueryClient — fetchQuery caches the payload under the def key', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryFn = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      expect(signal).toBeInstanceOf(AbortSignal); // the RQ context satisfies the def's seam
      return listDto;
    });
    const def = defineEndpoint({ key: ['codes', 'client'] as const, queryFn });

    const fetched = await client.fetchQuery({ queryKey: def.key, queryFn: def.queryFn });

    expect(fetched).toEqual(listDto);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(def.key)).toEqual(listDto);
  });

  it('spreads into every key-consuming option shape (compile-time)', () => {
    const query: UseAppQueryOptions<CodeDto[], CodeDto[]> = { ...listCodes };
    const mapped: UseAppQueryOptions<CodeDto[], number> = { ...listCodes, map: (raw) => raw.length };
    const suspense: AppSuspenseQueryOptions<CodeDto[], CodeDto[]> = { ...listCodes };
    const lazy: UseAppLazyQueryOptions<CodeDto[], CodeDto[]> = { ...listCodes };
    const prefetch: PrefetchTarget = listCodes;
    const cachePrefetch: QueryCachePrefetch = codeDetail('a');
    void [query, mapped, suspense, lazy, prefetch, cachePrefetch];
    expect(true).toBe(true);
  });

  it('infers hook data from the def alone — no map → raw, map → mapped, explicit generic intact (compile-time)', () => {
    // Never called — a pure type-level probe; the `use` prefix satisfies rules-of-hooks.
    function useInferenceProbe() {
      // Spread def, no `map`, no annotation → `data` is the def's raw type (`TData` defaults to `TRaw`).
      const identity = useAppQuery({ ...listCodes });
      const identityData: CodeDto[] | undefined = identity.data;
      // @ts-expect-error — `data` is `CodeDto[] | undefined`, not `string | undefined` (and not `any`)
      const identityWrong: string | undefined = identity.data;

      // With `map` → `data` infers from the mapper's return.
      const mapped = useAppQuery({ ...listCodes, map: (raw) => raw.length });
      const mappedData: number | undefined = mapped.data;
      // @ts-expect-error — mapped `data` is `number | undefined`, not the raw `CodeDto[]`
      const mappedWrong: CodeDto[] | undefined = mapped.data;

      // Explicit single generic keeps the identity meaning: raw AND data.
      const explicit = useAppQuery<CodeDto[]>({ ...listCodes });
      const explicitData: CodeDto[] | undefined = explicit.data;

      // Sibling surfaces follow the same `<TRaw, TData = TRaw>` order.
      const suspense = useAppSuspenseQuery({ ...listCodes });
      const suspenseData: CodeDto[] = suspense.data;
      const lazy = useAppLazyQuery({ ...listCodes });
      const lazyData: CodeDto[] | undefined = lazy.data;
      const batch = useAppQueries({ queries: [{ ...listCodes }] });
      const batchData: readonly (CodeDto[] | undefined)[] = batch.data;

      return [identityData, identityWrong, mappedData, mappedWrong, explicitData, suspenseData, lazyData, batchData];
    }
    void useInferenceProbe;
    expect(true).toBe(true);
  });

  it('accepts the EndpointFn annotation for factory registries', async () => {
    const detail: EndpointFn<[id: string], CodeDto> = codeDetail;
    const list: EndpointFn<[], CodeDto[]> = () => listCodes;

    expect(detail('z').key).toEqual(['codes', 'z']);
    await expect(list().queryFn({ signal: new AbortController().signal })).resolves.toEqual(listDto);
  });

  it('rejects malformed defs, mismatched raw types, and wrong factory args at compile time', () => {
    // @ts-expect-error — `key` is required
    defineEndpoint({ queryFn: async () => listDto });
    // @ts-expect-error — `queryFn` is required
    defineEndpoint({ key: ['codes'] });
    // @ts-expect-error — a def carries only `key` + `queryFn` (RQ options stay at the hook)
    defineEndpoint({ key: ['codes'], queryFn: async () => listDto, staleTime: 5_000 });
    // @ts-expect-error — the fetcher must return a promise
    defineEndpoint({ key: ['codes'], queryFn: () => listDto });
    // @ts-expect-error — `TRaw` flows from the fetcher; a def can't lie about its payload
    const wrong: Endpoint<string> = listCodes;
    // @ts-expect-error — the raw type is pinned; `map` sees `CodeDto[]`, not `string`
    const badMap: UseAppQueryOptions<string, number> = { ...listCodes, map: (raw) => raw.length };
    // @ts-expect-error — factory args are typed: `id` is required
    codeDetail();
    // @ts-expect-error — factory args are typed: `id` is a string
    codeDetail(1);
    void [wrong, badMap];
    expect(true).toBe(true);
  });
});
