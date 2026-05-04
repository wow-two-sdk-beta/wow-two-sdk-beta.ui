import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';

export interface ActivityFeedProps extends HTMLAttributes<HTMLOListElement> {
  /** Compact spacing variant. */
  dense?: boolean;
  children: ReactNode;
}

export interface ActivityItemProps extends HTMLAttributes<HTMLLIElement> {
  /** Avatar / icon node rendered in the leading column. */
  avatar?: ReactNode;
  /** The activity sentence (actor + verb + target). */
  children: ReactNode;
  /** Timestamp (relative or absolute). */
  timestamp?: ReactNode;
  /** Optional content preview rendered under the sentence
   *  (e.g. quoted comment, file name, image). */
  preview?: ReactNode;
  /** Trailing actions slot (e.g. Reply / Like). */
  actions?: ReactNode;
  /** Suppress the connector line under the leading column. */
  last?: boolean;
}

const ActivityFeedInner = forwardRef<HTMLOListElement, ActivityFeedProps>(
  ({ dense, children, className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn('flex list-none flex-col', dense ? 'gap-3' : 'gap-5', className)}
      data-dense={dense ? '' : undefined}
      {...props}
    >
      {children}
    </ol>
  ),
);
ActivityFeedInner.displayName = 'ActivityFeed';

export const ActivityItem = forwardRef<HTMLLIElement, ActivityItemProps>(
  (
    { avatar, children, timestamp, preview, actions, last, className, ...props },
    ref,
  ) => (
    <li
      ref={ref}
      className={cn('relative flex gap-3', className)}
      data-last={last ? '' : undefined}
      {...props}
    >
      <div className="relative flex flex-col items-center">
        <div className="z-10 shrink-0">{avatar}</div>
        {!last && (
          <span
            aria-hidden="true"
            className="mt-1 w-px flex-1 bg-border"
          />
        )}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-sm leading-relaxed text-foreground">
          {children}
          {timestamp && (
            <span className="ml-2 text-xs text-muted-foreground">{timestamp}</span>
          )}
        </div>
        {preview && (
          <div className="mt-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {preview}
          </div>
        )}
        {actions && (
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {actions}
          </div>
        )}
      </div>
    </li>
  ),
);
ActivityItem.displayName = 'ActivityFeed.Item';

type ActivityFeedComponent = typeof ActivityFeedInner & {
  Item: typeof ActivityItem;
};

export const ActivityFeed = ActivityFeedInner as ActivityFeedComponent;
ActivityFeed.Item = ActivityItem;

export default ActivityFeed;
