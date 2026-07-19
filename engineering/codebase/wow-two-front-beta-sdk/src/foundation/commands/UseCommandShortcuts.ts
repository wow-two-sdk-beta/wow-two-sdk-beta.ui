// Binds every available command that carries a `shortcut` to its chord, in one hook. This is the join between the
// commands vector and `foundation/shortcuts`: the registry owns "what can run", `useHotkeyMap` owns "what the
// keyboard did", and this hook keeps the two in sync as commands register and unregister.
//
// Non-obvious decisions:
// - The map is rebuilt from `registry.available()` on every registry mutation (via the version cursor), so a
//   command whose `when()` starts failing loses its binding instead of firing invisibly.
// - Two commands claiming the same chord collapse to one entry — last registered wins, matching the registry's
//   own last-wins rule for duplicate ids. Object keys can't hold both, and silently binding only one is better
//   than throwing during a render.
// - `context` is read through a ref. The map is memoized on the registry version, so a handler closing over the
//   `context` option directly would keep serving the value from the render that last mutated the registry.
// - Chord parsing is NOT duplicated here — the raw `shortcut` string is handed to `useHotkeyMap`, which parses it
//   with the same `applePlatform` option `commandShortcutLabel` uses for display.

import { useCallback, useMemo, useRef } from 'react';

import { useHotkeyMap, type HotkeyOptions } from '../shortcuts';

import type { CommandContext } from './Command';
import type { CommandRegistry } from './CommandRegistry';
import { useCommandRegistryVersion } from './UseCommandRegistry';

/** Tunes command-shortcut binding — every `useHotkeyMap` option, plus the payload passed to the command. */
export interface CommandShortcutOptions extends HotkeyOptions {
  /** Forwarded to `registry.run(id, context)` on every trigger. Read live, so changing it needs no re-binding. */
  readonly context?: CommandContext;

  /** Notified after a triggered command settles — the seam for closing a palette or logging the outcome. */
  readonly onRun?: (id: string) => void;
}

/**
 * Binds the chord of every available command in `registry`, running the command on trigger. Re-binds whenever the
 * registry changes. Commands without a `shortcut`, and commands `when()`/`enabled` currently blocks, bind nothing.
 *
 * Failures are swallowed by design — `registry.run` never throws and routes errors to the registry's `onError`.
 */
export function useCommandShortcuts(registry: CommandRegistry, options?: CommandShortcutOptions): void {
  const version = useCommandRegistryVersion(registry);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const trigger = useCallback(
    (id: string): void => {
      void registry.run(id, optionsRef.current?.context).then(() => optionsRef.current?.onRun?.(id));
    },
    [registry],
  );

  const map = useMemo(() => {
    const bindings: Record<string, (event: KeyboardEvent) => void> = {};
    for (const command of registry.available()) {
      const shortcut = command.shortcut;
      if (shortcut === undefined) continue;
      const id = command.id;
      bindings[shortcut] = () => trigger(id);
    }
    return bindings;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` is the mutation cursor that invalidates the map
  }, [registry, trigger, version]);

  useHotkeyMap(map, options);
}
