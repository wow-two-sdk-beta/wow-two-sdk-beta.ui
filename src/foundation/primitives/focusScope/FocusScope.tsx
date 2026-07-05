import { FocusScope as RadixFocusScope } from '@radix-ui/react-focus-scope';

export type FocusScopeProps = React.ComponentProps<typeof RadixFocusScope>;

/**
 * Trap focus within children. On unmount, returns focus to the previously
 * focused element. Pass `loop` to wrap Tab navigation; `trapped` to enable
 * the trap (default true while mounted).
 *
 * Wraps `@radix-ui/react-focus-scope` — battle-tested implementation.
 */
export const FocusScope = RadixFocusScope;
