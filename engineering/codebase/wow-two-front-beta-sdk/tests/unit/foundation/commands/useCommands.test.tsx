import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import {
  CommandsProvider,
  createCommandRegistry,
  useAvailableCommands,
  useCommand,
  useCommandList,
  useCommandShortcuts,
  useCommands,
  useRegisterCommands,
  type Command,
  type CommandRegistry,
} from '@src/foundation/commands';

// Browser project (real DOM + window). Chords are parsed with `applePlatform: true` and events dispatched with
// `metaKey`, so binding is deterministic regardless of the host OS — same approach as the shortcuts suite.
// Registry mutations are wrapped in `act` because subscribers re-render on them.

const APPLE = { applePlatform: true } as const;

afterEach(cleanup);

/** Builds a command with a no-op handler; override any field per test. */
function cmd(id: string, overrides: Partial<Command> = {}): Command {
  return { id, title: id, run: () => undefined, ...overrides };
}

/** Dispatches a keydown on `window`, wrapped in `act` so the effect-installed listener is guaranteed attached. */
function press(key: string, mods: KeyboardEventInit = {}): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods }));
  });
}

/** Wraps a hook in a provider bound to `registry`, so the test can inspect what the hook registered. */
function wrapperFor(registry: CommandRegistry) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <CommandsProvider registry={registry}>{children}</CommandsProvider>;
  };
}

describe('CommandsProvider / useCommands', () => {
  it('exposes the registry passed to the provider', () => {
    const registry = createCommandRegistry();
    const { result } = renderHook(() => useCommands(), { wrapper: wrapperFor(registry) });

    expect(result.current).toBe(registry);
  });

  it('owns a registry when none is supplied', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return <CommandsProvider>{children}</CommandsProvider>;
    }
    const { result } = renderHook(() => useCommands(), { wrapper: Wrapper });

    act(() => void result.current.register(cmd('a')));

    expect(result.current.get('a')).toBeDefined();
  });

  it('throws when used without a provider', () => {
    expect(() => renderHook(() => useCommands())).toThrow(/CommandsProvider/);
  });
});

describe('useRegisterCommands', () => {
  it('registers on mount and unregisters on unmount', () => {
    const registry = createCommandRegistry();
    const { unmount } = renderHook(() => useRegisterCommands([cmd('save'), cmd('open')]), {
      wrapper: wrapperFor(registry),
    });

    expect(registry.list().map((c) => c.id)).toEqual(['save', 'open']);

    act(() => unmount());

    expect(registry.list()).toHaveLength(0);
  });

  it('accepts an explicit registry without a provider', () => {
    const registry = createCommandRegistry();
    const { unmount } = renderHook(() => useRegisterCommands([cmd('save')], registry));

    expect(registry.get('save')).toBeDefined();

    act(() => unmount());

    expect(registry.get('save')).toBeUndefined();
  });

  it('runs the LATEST render closure even when the array identity churns', async () => {
    const registry = createCommandRegistry();
    const seen: number[] = [];
    const { rerender } = renderHook(
      // A fresh inline array every render — the common call site, deliberately not memoized.
      ({ count }: { count: number }) =>
        useRegisterCommands([cmd('inc', { run: () => void seen.push(count) })], registry),
      { initialProps: { count: 1 } },
    );

    await act(async () => void (await registry.run('inc')));
    rerender({ count: 2 });
    await act(async () => void (await registry.run('inc')));

    expect(seen).toEqual([1, 2]);
  });

  it('re-evaluates when() against the latest render', () => {
    const registry = createCommandRegistry();
    const { rerender } = renderHook(
      ({ allowed }: { allowed: boolean }) =>
        useRegisterCommands([cmd('gated', { when: () => allowed })], registry),
      { initialProps: { allowed: false } },
    );

    expect(registry.available()).toHaveLength(0);

    rerender({ allowed: true });

    expect(registry.available()).toHaveLength(1);
  });

  it('does not re-register in a loop when the same component also subscribes', () => {
    const registry = createCommandRegistry();
    let renders = 0;
    renderHook(() => {
      renders += 1;
      useRegisterCommands([cmd('a'), cmd('b')], registry);
      return useAvailableCommands(registry);
    });

    // Registering notifies the subscriber → one extra render, then the content signature is unchanged and it settles.
    expect(renders).toBeLessThan(5);
    expect(registry.list()).toHaveLength(2);
  });
});

describe('useCommand / list hooks', () => {
  it('re-renders when the observed command is registered and removed', () => {
    const registry = createCommandRegistry();
    const { result } = renderHook(() => useCommand('save'), { wrapper: wrapperFor(registry) });

    expect(result.current).toBeUndefined();

    const save = cmd('save', { title: 'Save file' });
    act(() => void registry.register(save));
    expect(result.current).toBe(save);

    act(() => void registry.unregister('save'));
    expect(result.current).toBeUndefined();
  });

  it('tracks the full list and the available subset separately', () => {
    const registry = createCommandRegistry();
    const { result } = renderHook(() => ({
      all: useCommandList(registry),
      open: useAvailableCommands(registry),
    }));

    act(() => void registry.registerAll([cmd('a'), cmd('b', { enabled: false })]));

    expect(result.current.all.map((c) => c.id)).toEqual(['a', 'b']);
    expect(result.current.open.map((c) => c.id)).toEqual(['a']);
  });
});

describe('useCommandShortcuts', () => {
  it('runs a command when its chord is dispatched', () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('palette', { title: 'Open palette', shortcut: 'mod+k', run }));

    renderHook(() => useCommandShortcuts(registry, APPLE));
    press('k', { metaKey: true });

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('binds a command registered after mount', () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    renderHook(() => useCommandShortcuts(registry, APPLE));

    act(() => void registry.register(cmd('late', { shortcut: 'mod+k', run })));
    press('k', { metaKey: true });

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('drops the binding once the command is unregistered', () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    const dispose = registry.register(cmd('palette', { shortcut: 'mod+k', run }));
    renderHook(() => useCommandShortcuts(registry, APPLE));

    act(() => void dispose());
    press('k', { metaKey: true });

    expect(run).not.toHaveBeenCalled();
  });

  it('does not bind a command blocked by when()', () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('gated', { shortcut: 'mod+k', when: () => false, run }));

    renderHook(() => useCommandShortcuts(registry, APPLE));
    press('k', { metaKey: true });

    expect(run).not.toHaveBeenCalled();
  });

  it('ignores commands without a shortcut', () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('plain', { run }));

    renderHook(() => useCommandShortcuts(registry, APPLE));
    press('k', { metaKey: true });

    expect(run).not.toHaveBeenCalled();
  });

  it('forwards the context option to the handler', () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('palette', { shortcut: 'mod+k', run }));

    renderHook(() => useCommandShortcuts(registry, { ...APPLE, context: { source: 'hotkey' } }));
    press('k', { metaKey: true });

    expect(run).toHaveBeenCalledWith({ source: 'hotkey' });
  });

  it('unbinds on unmount', () => {
    const registry = createCommandRegistry();
    const run = vi.fn();
    registry.register(cmd('palette', { shortcut: 'mod+k', run }));
    const { unmount } = renderHook(() => useCommandShortcuts(registry, APPLE));

    act(() => unmount());
    press('k', { metaKey: true });

    expect(run).not.toHaveBeenCalled();
  });
});
