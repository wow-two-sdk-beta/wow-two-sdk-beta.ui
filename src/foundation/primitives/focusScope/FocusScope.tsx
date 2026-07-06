import { FocusScope as RadixFocusScope } from '@radix-ui/react-focus-scope';

export type FocusScopeProps = React.ComponentProps<typeof RadixFocusScope>;

/**
 * Focus-management scope. On unmount, returns focus to the previously
 * focused element. Pass `loop` to wrap Tab navigation; `trapped` to trap
 * focus within children (defaults to false — focus may leave the scope
 * unless explicitly trapped).
 *
 * Wraps `@radix-ui/react-focus-scope` — battle-tested implementation.
 */
export const FocusScope = RadixFocusScope;
