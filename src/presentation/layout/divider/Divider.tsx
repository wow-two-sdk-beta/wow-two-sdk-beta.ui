import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn, Orientation } from '../../../foundation/utils';
import { dividerVariants } from './Divider.variants';

type DividerBaseProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/** A plain rule — `orientation` is required (no silent default; a rule's axis should always be stated). */
export interface PlainDividerProps extends DividerBaseProps {
  /**
   * The axis of the rule — the line's OWN direction: `vertical` draws a `│` between side-by-side content;
   * `horizontal` draws a `─` between stacked content.
   */
  orientation: Orientation;

  label?: never;
}

/** A labelled rule — the classic "or" separator; always horizontal, so `orientation` does not apply. */
export interface LabelledDividerProps extends DividerBaseProps {
  /** The centered content overlaid on the (always-horizontal) rule, e.g. `<Divider label="or" />`. */
  label: ReactNode;

  orientation?: never;
}

/**
 * A thin rule that separates content, using the semantic `border` token. Either a plain rule — pass the
 * required `orientation` (`<Divider orientation={Orientation.Vertical} />`) — or a labelled horizontal rule —
 * pass `label` (`<Divider label="or" />`), which sits on the surface background.
 */
export type DividerProps = PlainDividerProps | LabelledDividerProps;

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation, label, className, ...props }, ref) => {
    if (label != null) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn('flex w-full items-center gap-3', className)}
          {...props}
        >
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(dividerVariants({ orientation }), className)}
        {...props}
      />
    );
  },
);
Divider.displayName = 'Divider';
