import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils';

export interface MessageListHandle {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isAtBottom: () => boolean;
}

export interface MessageListProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot rendered above the message stream (e.g. "load older"). */
  header?: ReactNode;
  /** Slot rendered below the message stream (e.g. typing indicator). */
  footer?: ReactNode;
  /** Auto-scroll to bottom when children change *and* the viewer is near
   *  the bottom. Default true. */
  stickToBottom?: boolean;
  /** Threshold (px) considered "at bottom" for stickiness. Default 32. */
  bottomThreshold?: number;
  /** Show a floating "jump to bottom" button when scrolled away. Default true. */
  showJumpToBottom?: boolean;
  /** Reverse-render messages (newest at top). v1 keeps natural top→bottom. */
  reverse?: boolean;
  children: ReactNode;
}

export interface DaySeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Label (e.g. "Today", "Yesterday", "Mar 5"). */
  label: ReactNode;
}

export const DaySeparator = forwardRef<HTMLDivElement, DaySeparatorProps>(
  ({ label, className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn('flex items-center gap-3 py-2', className)}
      {...props}
    >
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  ),
);
DaySeparator.displayName = 'MessageList.DaySeparator';

const MessageListInner = forwardRef<MessageListHandle, MessageListProps>(
  (
    {
      header,
      footer,
      stickToBottom = true,
      bottomThreshold = 32,
      showJumpToBottom = true,
      reverse: _reverse,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    void _reverse;
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = useState(true);

    const isNearBottom = useCallback(() => {
      const el = scrollerRef.current;
      if (!el) return true;
      return el.scrollHeight - el.clientHeight - el.scrollTop <= bottomThreshold;
    }, [bottomThreshold]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    }, []);

    useImperativeHandle(
      ref,
      () => ({ scrollToBottom, isAtBottom: isNearBottom }),
      [scrollToBottom, isNearBottom],
    );

    useLayoutEffect(() => {
      if (stickToBottom && isNearBottom()) scrollToBottom('auto');
    }, [children, stickToBottom, isNearBottom, scrollToBottom]);

    useEffect(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const onScroll = () => setAtBottom(isNearBottom());
      el.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => el.removeEventListener('scroll', onScroll);
    }, [isNearBottom]);

    return (
      <div className={cn('relative flex h-full min-h-0 flex-col', className)} {...props}>
        {header && <div className="shrink-0">{header}</div>}
        <div
          ref={scrollerRef}
          className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          <div className="flex flex-col gap-2">{children}</div>
        </div>
        {footer && <div className="shrink-0 border-t border-border px-3 py-2">{footer}</div>}
        {showJumpToBottom && !atBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            aria-label="Jump to latest"
            className={cn(
              'absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full',
              'border border-border bg-background text-foreground shadow-md',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
MessageListInner.displayName = 'MessageList';

type MessageListComponent = typeof MessageListInner & {
  DaySeparator: typeof DaySeparator;
};

export const MessageList = MessageListInner as MessageListComponent;
MessageList.DaySeparator = DaySeparator;

export default MessageList;
