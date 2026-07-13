import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../foundation/utils';
import {
  useFormControl,
  useFormControlChrome,
} from '../../../foundation/primitives/formControlContext/FormControlContext';

export type FormErrorMessageProps = ComponentPropsWithoutRef<'p'>;

/**
 * Error copy under a form control. Renders only when the surrounding
 * `FormControl` is `isInvalid` AND there is something to show. `id={errorId}`
 * for `aria-describedby` wiring — the node registers itself with the context,
 * so controls reference the id only while the message actually renders.
 *
 * Without `children` it renders the context's `errors` (fed by the forms-engine
 * `form.Field` glue) — ALL of them, client + server merged. Pass `children` to
 * override with a single hand-written message.
 */
export const FormErrorMessage = forwardRef<HTMLParagraphElement, FormErrorMessageProps>(
  ({ className, id, children, ...props }, ref) => {
    const ctx = useFormControl();
    // Booleans/empty strings are render-nothing JSX (`{cond && 'msg'}`) — fall through to ctx errors.
    const hasChildren = children != null && children !== false && children !== '';
    const messages = hasChildren ? [] : (ctx?.errors ?? []);
    const isShown = (hasChildren || messages.length > 0) && (ctx ? ctx.isInvalid : true);
    // Register only while rendering under the context id — an explicit `id` prop
    // means the context's errorId is NOT in the DOM and must stay unreferenced.
    useFormControlChrome('error', isShown && id == null);
    if (!isShown) return null;
    return (
      <p
        ref={ref}
        id={id ?? ctx?.errorId}
        role="alert"
        className={cn('text-sm text-destructive', className)}
        {...props}
      >
        {hasChildren
          ? children
          : messages.length === 1
            ? messages[0]
            : messages.map((message, index) => (
                <span key={index} className="block">
                  {message}
                </span>
              ))}
      </p>
    );
  },
);
FormErrorMessage.displayName = 'FormErrorMessage';
