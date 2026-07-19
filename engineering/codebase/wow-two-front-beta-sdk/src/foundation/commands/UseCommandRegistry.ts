// The React subscription seam over a registry — how a component re-renders when commands come and go.
//
// The non-obvious part is why these read `registry.version()` instead of the command list directly:
// `useSyncExternalStore` re-invokes `getSnapshot` after every notification and re-renders whenever the returned
// value changes identity. `list()` / `available()` build a fresh array per call, so using either as the snapshot
// would report a change on every render and loop forever. The monotonic version number is identity-stable
// between mutations, so it is the snapshot; the arrays are derived from it through `useMemo`.
//
// These hooks take the registry explicitly (no context), so a scoped palette can drive its own registry.
// `CommandsContext.tsx` provides the ambient-registry conveniences on top.

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { Command } from './Command';
import type { CommandRegistry } from './CommandRegistry';

/**
 * Subscribes to a registry's mutations and returns its current version counter. The building block behind
 * {@link useCommandList} / {@link useAvailableCommands}; use it directly to derive a custom projection
 * (`useMemo(() => registry.list().filter(mine), [registry, version])`).
 */
export function useCommandRegistryVersion(registry: CommandRegistry): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => registry.subscribe(onStoreChange),
    [registry],
  );
  const getVersion = useCallback(() => registry.version(), [registry]);
  // Server snapshot is the same read — the registry is plain in-memory state with no client-only source.
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}

/** Every registered command in insertion order, re-rendering the caller whenever the registry mutates. */
export function useCommandList(registry: CommandRegistry): readonly Command[] {
  const version = useCommandRegistryVersion(registry);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` is the mutation cursor that invalidates the list
  return useMemo(() => registry.list(), [registry, version]);
}

/**
 * The commands a palette should show — `available()` re-evaluated on every registry mutation.
 *
 * Availability also depends on whatever `when()` reads, and a registry mutation is the only trigger here: a
 * `when` predicate closing over unrelated state won't re-run on its own. Keep predicates over state the registry
 * sees (re-register on change — `useRegisterCommands` does this for you), not over free-floating variables.
 */
export function useAvailableCommands(registry: CommandRegistry): readonly Command[] {
  const version = useCommandRegistryVersion(registry);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` is the mutation cursor that invalidates the list
  return useMemo(() => registry.available(), [registry, version]);
}
