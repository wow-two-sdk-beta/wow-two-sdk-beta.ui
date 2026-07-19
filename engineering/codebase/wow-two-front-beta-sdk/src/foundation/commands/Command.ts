// The command contract — the pure, framework-free vocabulary of the commands vector. A `Command` is one
// invocable action (`file.save`, `nav.settings`) carrying everything a palette, menu, or keybinding layer needs
// to present and run it: identity, label, extra search terms, an optional chord, and an availability predicate.
//
// Two deliberate type choices keep this file dependency-free:
// - `icon` is `unknown`. Naming a React icon type here would drag presentation into foundation; the render site
//   knows its own icon library and casts (`command.icon as LucideIcon`).
// - `context` is `unknown` rather than a generic parameter. Making `Command<TContext>` generic would force the
//   registry, the search, and every hook generic too, for a payload that only the app's own `run` reads back.
//
// Registry mechanics (register / run / subscribe) live in `CommandRegistry.ts`; this file stays a vocabulary.

/** The opaque payload handed to a command's `run` — apps narrow it inside their own handler (`ctx as MyCtx`). */
export type CommandContext = unknown;

/** Describes one invocable action — the unit a palette lists, a menu renders, and a chord triggers. */
export interface Command {
  /** The stable identity. Re-registering the same `id` replaces the prior entry, so keep it constant across renders. */
  readonly id: string;

  /** The human label — the primary search field and the text a palette row shows. */
  readonly title: string;

  /** Optional supporting text for the row. Deliberately NOT searched: a long description matches nearly every query. */
  readonly description?: string;

  /** Optional grouping label (`Navigation`, `Editor`) — used for section headers and searched at the lowest rank. */
  readonly group?: string;

  /** Extra search terms that don't belong in the title (`['theme', 'appearance']` for "Toggle dark mode"). */
  readonly keywords?: readonly string[];

  /** Optional chord string in `foundation/shortcuts` syntax (`'mod+k'`) — bound by `useCommandShortcuts`, rendered by `commandShortcutLabel`. */
  readonly shortcut?: string;

  /** Optional icon slot, intentionally untyped — foundation must not name a React icon type. The render site casts. */
  readonly icon?: unknown;

  /** Availability predicate re-evaluated on every read. Must be cheap and side-effect free (`available()` calls it per command). */
  readonly when?: () => boolean;

  /** Hard off-switch — `false` hides the command from `available()` regardless of `when`. Defaults to `true`. */
  readonly enabled?: boolean;

  /** The handler. May be sync or async; the registry awaits it and routes a rejection to its `onError`. */
  readonly run: (context?: CommandContext) => void | Promise<void>;
}

/**
 * Reports whether a command may run right now — `enabled !== false` **and** `when()` (when present) passing.
 * Exported so a surface holding a plain array (not a registry) applies the same rule the registry does.
 * Propagates a throw from `when`; `registry.run` guards against that, direct callers should not pass a throwing predicate.
 */
export function isCommandAvailable(command: Command): boolean {
  if (command.enabled === false) return false;
  return command.when === undefined || command.when();
}

/**
 * Defines the result of `registry.run(...)`. Every path resolves to one of these — the registry never throws, so a
 * keystroke handler needs no try/catch and a caller can distinguish "no such command" from "blocked" from "failed".
 */
export const CommandRunOutcome = {
  /** The handler ran to completion (an async handler resolved). */
  Ran: 'ran',
  /** No command is registered under that id. */
  NotFound: 'not-found',
  /** The command exists but `when()` / `enabled` blocked it. */
  Unavailable: 'unavailable',
  /** The handler threw or rejected — the error was routed to the registry's `onError`. */
  Failed: 'failed',
} as const;

export type CommandRunOutcome = (typeof CommandRunOutcome)[keyof typeof CommandRunOutcome];
