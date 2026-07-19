import { describe, expect, it, vi } from 'vitest';

import {
  CommandMatchRank,
  CommandRunOutcome,
  NO_MATCH,
  commandShortcutLabel,
  createCommandRegistry,
  isCommandAvailable,
  rankCommand,
  searchCommands,
  type Command,
} from '@src/foundation/commands';

// Node project — the registry and the search are pure (no DOM, no React). The chord label is exercised with an
// explicit `applePlatform` so formatting is deterministic regardless of the host running the suite.

/** Builds a command with a no-op handler; override any field per test. */
function cmd(id: string, overrides: Partial<Command> = {}): Command {
  return { id, title: id, run: () => undefined, ...overrides };
}

/** Collects the ids of a command list — the shape most order assertions want. */
function ids(commands: readonly Command[]): string[] {
  return commands.map((command) => command.id);
}

describe('createCommandRegistry — registration', () => {
  it('registers a command and looks it up by id', () => {
    const registry = createCommandRegistry();
    const save = cmd('save');

    registry.register(save);

    expect(registry.get('save')).toBe(save);
    expect(ids(registry.list())).toEqual(['save']);
  });

  it('returns a disposer that unregisters exactly the entry it registered', () => {
    const registry = createCommandRegistry();
    const dispose = registry.register(cmd('save'));

    expect(dispose()).toBeUndefined();
    expect(registry.get('save')).toBeUndefined();
    expect(registry.list()).toHaveLength(0);
  });

  it('makes a stale disposer a no-op after the id was replaced', () => {
    const registry = createCommandRegistry();
    const disposeFirst = registry.register(cmd('save', { title: 'First' }));
    const second = cmd('save', { title: 'Second' });
    registry.register(second);

    disposeFirst(); // the entry it owned is gone — must not evict the replacement

    expect(registry.get('save')).toBe(second);
  });

  it('replaces a duplicate id (last wins) while keeping its original list position', () => {
    const registry = createCommandRegistry();
    registry.register(cmd('a'));
    registry.register(cmd('b'));
    const replacement = cmd('a', { title: 'Replaced' });

    registry.register(replacement);

    expect(registry.get('a')).toBe(replacement);
    expect(registry.list()).toHaveLength(2);
    expect(ids(registry.list())).toEqual(['a', 'b']); // 'a' did not move to the end
  });

  it('keeps list() in insertion order', () => {
    const registry = createCommandRegistry();
    registry.registerAll([cmd('c'), cmd('a'), cmd('b')]);

    expect(ids(registry.list())).toEqual(['c', 'a', 'b']);
  });

  it('unregisters by id and reports whether anything was removed', () => {
    const registry = createCommandRegistry();
    registry.register(cmd('save'));

    expect(registry.unregister('save')).toBe(true);
    expect(registry.unregister('save')).toBe(false);
    expect(registry.unregister('never-registered')).toBe(false);
  });

  it('disposes an entire registerAll batch at once', () => {
    const registry = createCommandRegistry();
    const dispose = registry.registerAll([cmd('a'), cmd('b'), cmd('c')]);

    dispose();

    expect(registry.list()).toHaveLength(0);
  });
});

describe('createCommandRegistry — availability', () => {
  it('excludes commands whose when() fails and those explicitly disabled', () => {
    const registry = createCommandRegistry();
    registry.registerAll([
      cmd('always'),
      cmd('blocked', { when: () => false }),
      cmd('allowed', { when: () => true }),
      cmd('off', { enabled: false }),
      cmd('on', { enabled: true }),
    ]);

    expect(ids(registry.available())).toEqual(['always', 'allowed', 'on']);
  });

  it('re-evaluates when() on every read', () => {
    const registry = createCommandRegistry();
    let signedIn = false;
    registry.register(cmd('logout', { when: () => signedIn }));

    expect(registry.available()).toHaveLength(0);
    signedIn = true;
    expect(registry.available()).toHaveLength(1);
  });

  it('lets enabled:false win over a passing when()', () => {
    expect(isCommandAvailable(cmd('x', { enabled: false, when: () => true }))).toBe(false);
    expect(isCommandAvailable(cmd('x'))).toBe(true);
  });
});

describe('createCommandRegistry — run', () => {
  it('runs a command and reports "ran"', async () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('save', { run }));

    await expect(registry.run('save')).resolves.toBe(CommandRunOutcome.Ran);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('passes the context through to the handler', async () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('save', { run }));

    await registry.run('save', { from: 'palette' });

    expect(run).toHaveBeenCalledWith({ from: 'palette' });
  });

  it('reports "not-found" for an unknown id without throwing', async () => {
    const registry = createCommandRegistry();

    await expect(registry.run('ghost')).resolves.toBe(CommandRunOutcome.NotFound);
  });

  it('reports "unavailable" for a when()-blocked command and never invokes it', async () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('save', { run, when: () => false }));

    await expect(registry.run('save')).resolves.toBe(CommandRunOutcome.Unavailable);
    expect(run).not.toHaveBeenCalled();
  });

  it('reports "unavailable" for a disabled command', async () => {
    const registry = createCommandRegistry();
    registry.register(cmd('save', { enabled: false }));

    await expect(registry.run('save')).resolves.toBe(CommandRunOutcome.Unavailable);
  });

  it('awaits an async handler before resolving', async () => {
    const registry = createCommandRegistry();
    const order: string[] = [];
    registry.register(
      cmd('slow', {
        run: async () => {
          await Promise.resolve();
          order.push('handler');
        },
      }),
    );

    const outcome = await registry.run('slow');
    order.push('caller');

    expect(outcome).toBe(CommandRunOutcome.Ran);
    expect(order).toEqual(['handler', 'caller']);
  });

  it('routes a synchronous throw to onError and reports "failed"', async () => {
    const onError = vi.fn();
    const registry = createCommandRegistry({ onError });
    const boom = new Error('boom');
    const broken = cmd('broken', {
      run: () => {
        throw boom;
      },
    });
    registry.register(broken);

    await expect(registry.run('broken')).resolves.toBe(CommandRunOutcome.Failed);
    expect(onError).toHaveBeenCalledWith(boom, broken);
  });

  it('routes an async rejection to onError and reports "failed"', async () => {
    const onError = vi.fn();
    const registry = createCommandRegistry({ onError });
    const boom = new Error('async boom');
    registry.register(cmd('broken', { run: () => Promise.reject(boom) }));

    await expect(registry.run('broken')).resolves.toBe(CommandRunOutcome.Failed);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBe(boom);
  });

  it('does not throw when a handler fails and no onError was supplied', async () => {
    const registry = createCommandRegistry();
    registry.register(
      cmd('broken', {
        run: () => {
          throw new Error('boom');
        },
      }),
    );

    await expect(registry.run('broken')).resolves.toBe(CommandRunOutcome.Failed);
  });

  it('degrades a throwing when() predicate to "failed" rather than escaping', async () => {
    const onError = vi.fn();
    const registry = createCommandRegistry({ onError });
    registry.register(
      cmd('odd', {
        when: () => {
          throw new Error('bad predicate');
        },
      }),
    );

    await expect(registry.run('odd')).resolves.toBe(CommandRunOutcome.Failed);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('createCommandRegistry — subscribe', () => {
  it('notifies on register, replace, and unregister', () => {
    const registry = createCommandRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);

    registry.register(cmd('a'));
    registry.register(cmd('a', { title: 'replaced' }));
    registry.unregister('a');

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('notifies once for a registerAll batch and once for its disposal', () => {
    const registry = createCommandRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);

    const dispose = registry.registerAll([cmd('a'), cmd('b'), cmd('c')]);
    expect(listener).toHaveBeenCalledTimes(1);

    dispose();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does not notify when unregister removed nothing', () => {
    const registry = createCommandRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);

    registry.unregister('ghost');

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const registry = createCommandRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);

    unsubscribe();
    registry.register(cmd('a'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('bumps a monotonic version on every mutation', () => {
    const registry = createCommandRegistry();
    expect(registry.version()).toBe(0);

    registry.register(cmd('a'));
    const afterRegister = registry.version();
    registry.unregister('a');

    expect(afterRegister).toBeGreaterThan(0);
    expect(registry.version()).toBeGreaterThan(afterRegister);
  });

  it('does not bump the version on a read', () => {
    const registry = createCommandRegistry();
    registry.register(cmd('a'));
    const before = registry.version();

    registry.list();
    registry.available();
    registry.get('a');

    expect(registry.version()).toBe(before);
  });
});

describe('searchCommands', () => {
  const commands: readonly Command[] = [
    cmd('settings', { title: 'Open settings', group: 'Navigation' }),
    cmd('save', { title: 'Save file', keywords: ['write', 'persist'] }),
    cmd('theme', { title: 'Toggle dark mode', keywords: ['theme', 'appearance'], group: 'Preferences' }),
    cmd('search', { title: 'Search everywhere', group: 'Navigation' }),
  ];

  it('returns everything in original order for an empty query', () => {
    expect(ids(searchCommands(commands, ''))).toEqual(['settings', 'save', 'theme', 'search']);
  });

  it('treats a whitespace-only query as empty', () => {
    expect(ids(searchCommands(commands, '   '))).toEqual(ids(commands));
  });

  it('returns the input reference untouched for an empty query', () => {
    expect(searchCommands(commands, '')).toBe(commands);
  });

  it('is case-insensitive', () => {
    expect(ids(searchCommands(commands, 'SAVE'))).toEqual(['save']);
  });

  it('drops non-matching commands', () => {
    expect(searchCommands(commands, 'zzz')).toHaveLength(0);
  });

  it('ranks a title prefix above a title substring', () => {
    // 'Save file' starts with "sa"; 'Search everywhere' also starts with "s" but "sa" only prefixes one.
    const ranked = searchCommands(commands, 'se');
    expect(ids(ranked)[0]).toBe('search'); // prefix of 'Search everywhere'
    expect(ids(ranked)).toContain('settings'); // substring of 'Open settings'
    expect(ids(ranked).indexOf('search')).toBeLessThan(ids(ranked).indexOf('settings'));
  });

  it('ranks a title substring above a keyword hit', () => {
    const ranked = searchCommands(
      [cmd('kw', { title: 'Unrelated', keywords: ['mode'] }), cmd('sub', { title: 'Toggle mode' })],
      'mode',
    );

    expect(ids(ranked)).toEqual(['sub', 'kw']);
  });

  it('ranks a keyword hit above a group hit', () => {
    const ranked = searchCommands(
      [cmd('grp', { title: 'Unrelated', group: 'Persist' }), cmd('kw', { title: 'Other', keywords: ['persist'] })],
      'persist',
    );

    expect(ids(ranked)).toEqual(['kw', 'grp']);
  });

  it('matches on group', () => {
    expect(ids(searchCommands(commands, 'navigation'))).toEqual(['settings', 'search']);
  });

  it('does not match on description', () => {
    const withDescription = [cmd('d', { title: 'Nothing', description: 'contains the word banana' })];

    expect(searchCommands(withDescription, 'banana')).toHaveLength(0);
  });

  it('keeps the original relative order within a rank tier', () => {
    const sameTier = [cmd('first', { title: 'Go home' }), cmd('second', { title: 'Go back' })];

    expect(ids(searchCommands(sameTier, 'go'))).toEqual(['first', 'second']);
  });
});

describe('rankCommand', () => {
  it('scores each match tier and marks a miss as NO_MATCH', () => {
    const command = cmd('x', { title: 'Toggle dark mode', keywords: ['appearance'], group: 'Preferences' });

    expect(rankCommand(command, 'tog')).toBe(CommandMatchRank.TitlePrefix);
    expect(rankCommand(command, 'dark')).toBe(CommandMatchRank.TitleSubstring);
    expect(rankCommand(command, 'appear')).toBe(CommandMatchRank.Keyword);
    expect(rankCommand(command, 'prefer')).toBe(CommandMatchRank.Group);
    expect(rankCommand(command, 'nothing')).toBe(NO_MATCH);
  });

  it('matches everything at the best rank for an empty query', () => {
    expect(rankCommand(cmd('x', { title: 'Anything' }), '')).toBe(CommandMatchRank.TitlePrefix);
  });
});

describe('commandShortcutLabel', () => {
  it('renders the platform label for a chord', () => {
    const command = cmd('palette', { shortcut: 'mod+k' });

    expect(commandShortcutLabel(command, { applePlatform: true })).toBe('⌘K');
    expect(commandShortcutLabel(command, { applePlatform: false })).toBe('Ctrl+K');
  });

  it('returns undefined when the command carries no shortcut', () => {
    expect(commandShortcutLabel(cmd('plain'))).toBeUndefined();
  });

  it('falls back to the raw string when the chord will not parse', () => {
    expect(commandShortcutLabel(cmd('bad', { shortcut: 'mod+' }), { applePlatform: true })).toBe('mod+');
  });
});
