import { Fragment, forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Mark } from '../mark/Mark';

export interface HighlightProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Source text to render. */
  children: string;
  /** Substring(s) to highlight. Match is case-insensitive. */
  query: string | string[];
  /** When `true`, only highlights whole-word matches. Default `false`. */
  wholeWord?: boolean;
}

function escape(re: string) {
  return re.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Wraps each occurrence of `query` (or any of `query[]`) inside the
 * `children` text in a `<Mark>`. Case-insensitive; pass `wholeWord` to
 * avoid partial matches.
 */
export const Highlight = forwardRef<HTMLSpanElement, HighlightProps>(
  ({ children, query, wholeWord, className, ...props }, ref) => {
    const queries = (Array.isArray(query) ? query : [query]).filter(Boolean);
    if (queries.length === 0) return <span ref={ref} className={cn(className)} {...props}>{children}</span>;
    const pattern = queries.map(escape).join('|');
    const regex = new RegExp(wholeWord ? `\\b(${pattern})\\b` : `(${pattern})`, 'gi');
    const parts = children.split(regex);

    const nodes: ReactNode[] = [];
    parts.forEach((part, i) => {
      if (queries.some((q) => part.toLowerCase() === q.toLowerCase())) {
        nodes.push(<Mark key={i}>{part}</Mark>);
      } else if (part) {
        nodes.push(<Fragment key={i}>{part}</Fragment>);
      }
    });

    return (
      <span ref={ref} className={cn(className)} {...props}>
        {nodes}
      </span>
    );
  },
);
Highlight.displayName = 'Highlight';
