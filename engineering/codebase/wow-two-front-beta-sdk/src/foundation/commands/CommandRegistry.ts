// The registry — the headless core of the commands vector: a mutable, insertion-ordered `id → Command` store that
// a palette, menu, or keybinding layer reads from. Framework-free on purpose (no React import) so one can be
// created at module scope, inside a provider, or in a plain node test.
//
// Non-obvious decisions:
// - Re-registering an existing `id` REPLACES the entry (last wins) and keeps its ORIGINAL position in `list()`.
//   A `Map.set` on an existing key doesn't move it, which is what we want: a re-render refreshing a command must
//   not make the palette's rows jump around.
// - A `register` disposer removes only the entry it registered. A stale disposer firing after a replace is a
//   no-op — exactly what an effect cleanup racing a re-registration needs (cleanup runs after the next register).
// - `run` never throws. A missing id, a `when()`-blocked command, a throwing predicate, and a rejecting handler
//   all resolve to a `CommandRunOutcome`, with the error routed to `onError`. A keystroke handler shouldn't need
//   a try/catch, and a palette shouldn't crash because one command misbehaves.
// - Mutations bump a monotonic `version()` on top of notifying listeners. React's `useSyncExternalStore` needs a
//   snapshot whose identity is stable between mutations; `list()` / `available()` build fresh arrays every call
//   and would loop forever as snapshots. The version number is the stable cursor those hooks read instead.
// - `registerAll` applies every entry then notifies ONCE, so registering a screen's ten commands re-renders
//   subscribers a single time.

import { CommandRunOutcome, isCommandAvailable, type Command, type CommandContext } from './Command';

/** Receives an error thrown or rejected by a command's `run` (or its `when` predicate), alongside the offending command. */
export type CommandErrorHandler = (error: unknown, command: Command) => void;

/** Notified after any registry mutation — register, replace, or unregister. Carries no payload; re-read the registry. */
export type CommandRegistryListener = () => void;

/** Tunes a registry at creation. */
export interface CommandRegistryOptions {
  /** Where a failing `run` is reported. Omitted → failures are swallowed and surface only as a `'failed'` outcome. */
  readonly onError?: CommandErrorHandler;
}

/** The headless command store — registration, lookup, availability, execution, and change notification. */
export interface CommandRegistry {
  /** Registers (or replaces, when the `id` already exists) a command; returns a disposer that removes exactly this entry. */
  readonly register: (command: Command) => () => void;

  /** Registers many commands with a single change notification; returns one disposer removing all of them. */
  readonly registerAll: (commands: readonly Command[]) => () => void;

  /** Removes the command under `id`; returns whether anything was removed. */
  readonly unregister: (id: string) => boolean;

  /** Looks up one command by id — `undefined` when absent. Identity is stable between mutations (safe as a React snapshot). */
  readonly get: (id: string) => Command | undefined;

  /** Every registered command in insertion order (a replaced entry keeps its original slot). Fresh array per call. */
  readonly list: () => readonly Command[];

  /** The subset of `list()` that `isCommandAvailable` accepts — what a palette should actually show. Fresh array per call. */
  readonly available: () => readonly Command[];

  /** Executes a command by id. Never throws — see {@link CommandRunOutcome}. An async handler is awaited. */
  readonly run: (id: string, context?: CommandContext) => Promise<CommandRunOutcome>;

  /** Subscribes to mutations; returns an unsubscribe. */
  readonly subscribe: (listener: CommandRegistryListener) => () => void;

  /** A monotonic counter bumped on every mutation — the stable-identity snapshot React hooks subscribe to. */
  readonly version: () => number;
}

/**
 * Creates a {@link CommandRegistry}. One per app is the norm (a `CommandsProvider` owns it); create extra ones for
 * isolation in tests or for a scoped palette that must not see the global set.
 */
export function createCommandRegistry(options?: CommandRegistryOptions): CommandRegistry {
  const entries = new Map<string, Command>();
  const listeners = new Set<CommandRegistryListener>();
  let revision = 0;

  /** Bumps the version then fans out to listeners over a copy, so a listener may unsubscribe while being notified. */
  function notify(): void {
    revision += 1;
    for (const listener of [...listeners]) listener();
  }

  /** Removes `command` only if it is still the entry under its id; reports whether it removed anything. */
  function removeExact(command: Command): boolean {
    if (entries.get(command.id) !== command) return false;
    entries.delete(command.id);
    return true;
  }

  return {
    register(command: Command): () => void {
      entries.set(command.id, command);
      notify();
      return () => {
        if (removeExact(command)) notify();
      };
    },

    registerAll(commands: readonly Command[]): () => void {
      const registered = [...commands];
      for (const command of registered) entries.set(command.id, command);
      notify();
      return () => {
        let removed = false;
        for (const command of registered) removed = removeExact(command) || removed;
        if (removed) notify();
      };
    },

    unregister(id: string): boolean {
      if (!entries.delete(id)) return false;
      notify();
      return true;
    },

    get(id: string): Command | undefined {
      return entries.get(id);
    },

    list(): readonly Command[] {
      return [...entries.values()];
    },

    available(): readonly Command[] {
      return [...entries.values()].filter(isCommandAvailable);
    },

    async run(id: string, context?: CommandContext): Promise<CommandRunOutcome> {
      const command = entries.get(id);
      if (command === undefined) return CommandRunOutcome.NotFound;
      try {
        // Inside the try so a throwing `when` degrades to `'failed'` rather than escaping the "never throws" promise.
        if (!isCommandAvailable(command)) return CommandRunOutcome.Unavailable;
        await command.run(context);
        return CommandRunOutcome.Ran;
      } catch (error) {
        options?.onError?.(error, command);
        return CommandRunOutcome.Failed;
      }
    },

    subscribe(listener: CommandRegistryListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    version(): number {
      return revision;
    },
  };
}
