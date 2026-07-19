// The React seam — an ambient registry so a screen deep in the tree can contribute commands without threading a
// registry through props, following the repo's `LocaleContext` provider + hook shape.
//
// Non-obvious decisions:
// - `useCommands` THROWS without a provider, where `useLocale` falls back to a default. A locale has a sane
//   default (`en-US`); a registry does not — a silent fallback would accept registrations into a throwaway store
//   and the palette would just be empty, which is far harder to debug than a named error.
// - `useRegisterCommands` keys its effect on a CONTENT signature of the commands, never on array identity. Keying
//   on identity would re-register on every render for the common inline-array call site, and each registration
//   notifies subscribers → re-render → new array → register again: an infinite loop. (The repo's existing
//   `CommandPalette` carries the same warning about its item registry.)
// - Because the effect skips identity changes, the entries it registers delegate `run` / `when` back through a
//   ref to the LATEST render's command objects. Without that, a handler closing over props would be frozen at the
//   render that last changed the signature. Text metadata is part of the signature, so it re-registers when it
//   changes; behaviour is always live. Net effect: the caller does not have to memoize anything.
// - The signature is built with `JSON.stringify`, not a delimiter join: JSON quoting makes each field
//   self-delimiting, so a title containing the delimiter can't forge a boundary and alias two different sets.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react';

import { isCommandAvailable, type Command } from './Command';
import {
  createCommandRegistry,
  type CommandErrorHandler,
  type CommandRegistry,
} from './CommandRegistry';

const CommandsContext = createContext<CommandRegistry | undefined>(undefined);

/** Props for {@link CommandsProvider}. */
export interface CommandsProviderProps {
  /** An existing registry to share (module-scope singleton, a test's registry). Omitted → the provider owns one. */
  readonly registry?: CommandRegistry;

  /** Where a failing command's error goes. Ignored when `registry` is supplied — that registry carries its own handler. */
  readonly onError?: CommandErrorHandler;

  /** The subtree that may register and run commands. */
  readonly children: ReactNode;
}

/** Provides a command registry to every descendant — the mount point for `useCommands` / `useRegisterCommands`. */
export function CommandsProvider({ registry, onError, children }: CommandsProviderProps): ReactNode {
  // Ref-read so a fresh `onError` closure each render is picked up without rebuilding the registry.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [owned] = useState(() =>
    createCommandRegistry({ onError: (error, command) => onErrorRef.current?.(error, command) }),
  );

  return <CommandsContext.Provider value={registry ?? owned}>{children}</CommandsContext.Provider>;
}

/** Reads the ambient registry. Throws when no {@link CommandsProvider} is mounted — see the file header for why. */
export function useCommands(): CommandRegistry {
  const registry = useContext(CommandsContext);
  if (registry === undefined) {
    throw new Error('useCommands must be used inside a <CommandsProvider>');
  }
  return registry;
}

/**
 * Reads one command from the ambient registry by id, re-rendering when that command is registered, replaced, or
 * removed. `undefined` while nothing owns the id — a palette row can render a disabled placeholder from it.
 */
export function useCommand(id: string): Command | undefined {
  const registry = useCommands();
  const subscribe = useCallback(
    (onStoreChange: () => void) => registry.subscribe(onStoreChange),
    [registry],
  );
  // `get` returns the stored object, whose identity is stable between mutations — a valid snapshot as-is.
  const getCommand = useCallback(() => registry.get(id), [registry, id]);
  return useSyncExternalStore(subscribe, getCommand, getCommand);
}

/**
 * Builds the content key that decides when a registration is stale — every searchable / rendered text field plus
 * `enabled`. `run`, `when`, and `icon` are excluded (functions and opaque slots don't serialize); they stay fresh
 * through {@link bindToLatest} instead.
 */
function metadataSignature(command: Command): string {
  return JSON.stringify([
    command.id,
    command.title,
    command.description ?? '',
    command.group ?? '',
    command.keywords ?? [],
    command.shortcut ?? '',
    command.enabled !== false,
  ]);
}

/**
 * Wraps a command so `run` / `when` resolve against the latest render's array rather than the snapshot captured
 * when the effect last ran. Metadata comes from the snapshot — it is covered by the signature, so it can't drift.
 */
function bindToLatest(command: Command, latest: RefObject<readonly Command[]>): Command {
  const id = command.id;
  const resolve = (): Command | undefined => latest.current.find((candidate) => candidate.id === id);
  return {
    ...command,
    when: () => {
      const current = resolve();
      // Gone from the caller's array but not yet unregistered (mid-cleanup) → treat as unavailable.
      return current !== undefined && isCommandAvailable(current);
    },
    run: (context) => resolve()?.run(context),
  };
}

/**
 * Registers commands for as long as the calling component is mounted, unregistering on unmount. The array may be
 * an inline literal — no `useMemo` needed: registration re-runs when the commands' text metadata changes, and
 * `run` / `when` always call through to the latest render's closures.
 *
 * Pass `registry` to target a specific registry; otherwise the ambient one is used (and a missing provider throws).
 */
export function useRegisterCommands(commands: readonly Command[], registry?: CommandRegistry): void {
  const ambient = useContext(CommandsContext);
  const target = registry ?? ambient;

  const latest = useRef(commands);
  latest.current = commands;

  const signature = commands.map(metadataSignature).join('');

  useEffect(() => {
    if (target === undefined) return;
    return target.registerAll(latest.current.map((command) => bindToLatest(command, latest)));
    // `signature` is the content-stable key standing in for `commands` — see the file header on why identity fails.
  }, [target, signature]);

  // After the hooks, so hook order stays unconditional; a missing provider is a wiring bug, surfaced immediately.
  if (target === undefined) {
    throw new Error('useRegisterCommands must be used inside a <CommandsProvider>, or given an explicit registry');
  }
}
