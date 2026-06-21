import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import {
  Avatar,
  AvatarGroup,
  ChatBubble,
  DaySeparator,
  List,
  ListItem,
  MessageList,
  NotificationDot,
  ReactionBar,
  ThreadView,
  type Reaction as UiReaction,
} from '@wow-two-beta/ui/display';
import {
  PresenceIndicator,
  TypingIndicator,
  useToaster,
  type PresenceStatus,
} from '@wow-two-beta/ui/feedback';
import {
  ChatComposer,
  EmojiPicker,
  ReactionPicker,
  SearchInput,
} from '@wow-two-beta/ui/forms';
import { ScrollArea } from '@wow-two-beta/ui/layout';
import { Popover, PopoverContent, PopoverTrigger } from '@wow-two-beta/ui/overlays';
import {
  channels,
  messages as messageFixtures,
  thread,
  users,
  usersById,
  type Message,
  type ThreadReply,
  type User,
  type UserStatus,
} from '../../fixtures';

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                  */
/* ------------------------------------------------------------------ */

/** The signed-in viewer — Sora Tanaka (owner, online). */
const ME = 'usr-001';

const PRESENCE: Record<UserStatus, PresenceStatus> = {
  online: 'online',
  away: 'idle',
  dnd: 'busy',
  offline: 'offline',
};

/** Who is "typing" in each channel (fixed, deterministic). */
const TYPIST_ID: Record<string, string> = {
  'ch-deploys': 'usr-003',
  'ch-support': 'usr-007',
};

/** Fixed timestamps assigned to locally-sent messages (no clock calls). */
const NEW_MESSAGE_TIMES = [
  '2026-06-12T09:46:00Z',
  '2026-06-12T09:48:00Z',
  '2026-06-12T09:51:00Z',
  '2026-06-12T09:54:00Z',
  '2026-06-12T09:57:00Z',
  '2026-06-12T10:00:00Z',
] as const;

const FALLBACK_TIME = '2026-06-12T10:05:00Z';

function timeOf(iso: string): string {
  return iso.slice(11, 16);
}

function dayLabel(day: string): string {
  if (day === '2026-06-12') return 'Today';
  if (day === '2026-06-11') return 'Yesterday';
  return day;
}

function userName(id: string): string {
  return usersById[id]?.name ?? 'Unknown';
}

function firstName(id: string): string {
  return userName(id).split(' ')[0] ?? 'Someone';
}

/* ------------------------------------------------------------------ */
/* Small presentational bits                                            */
/* ------------------------------------------------------------------ */

function UserAvatar({ user, size = 'sm' }: { user: User; size?: 'xs' | 'sm' }) {
  return (
    <span className="relative inline-flex">
      <Avatar name={user.name} canAutoColor size={size} />
      <PresenceIndicator
        status={PRESENCE[user.status]}
        size="xs"
        position="bottom-right"
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                               */
/* ------------------------------------------------------------------ */

export default function ChatScreen() {
  const { toast } = useToaster();

  const [activeChannelId, setActiveChannelId] = useState('ch-deploys');
  const [allMessages, setAllMessages] = useState<Message[]>(messageFixtures);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadReplies, setThreadReplies] = useState<ThreadReply[]>(thread.replies);
  const [sentSeq, setSentSeq] = useState(0);
  const [unread, setUnread] = useState<Record<string, boolean>>({ 'ch-support': true });

  /* Typing indicator on a 6s loop — interval lives in an effect, never module scope. */
  const [typingVisible, setTypingVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setTypingVisible((v) => !v), 6000);
    return () => clearInterval(id);
  }, []);

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  const visibleMessages = useMemo(() => {
    const inChannel = allMessages.filter((m) => m.channelId === activeChannelId);
    const q = search.trim().toLowerCase();
    if (!q) return inChannel;
    return inChannel.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        userName(m.authorId).toLowerCase().includes(q),
    );
  }, [allMessages, activeChannelId, search]);

  const threadRoot = allMessages.find((m) => m.id === thread.rootMessageId) ?? null;

  /* ------------------------------ actions ------------------------------ */

  function selectChannel(id: string) {
    setActiveChannelId(id);
    setPickerFor(null);
    setSearch('');
    setUnread((u) => ({ ...u, [id]: false }));
  }

  function toggleReaction(messageId: string, emoji: string) {
    setAllMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        if (!existing) {
          return {
            ...m,
            reactions: [...m.reactions, { emoji, count: 1, userIds: [ME] }],
          };
        }
        const mine = existing.userIds.includes(ME);
        const next = mine
          ? {
              ...existing,
              count: existing.count - 1,
              userIds: existing.userIds.filter((u) => u !== ME),
            }
          : { ...existing, count: existing.count + 1, userIds: [...existing.userIds, ME] };
        return {
          ...m,
          reactions:
            next.count <= 0
              ? m.reactions.filter((r) => r.emoji !== emoji)
              : m.reactions.map((r) => (r.emoji === emoji ? next : r)),
        };
      }),
    );
  }

  function sendMessage(text: string) {
    if (!activeChannel) return;
    const sentAt = NEW_MESSAGE_TIMES[sentSeq % NEW_MESSAGE_TIMES.length] ?? FALLBACK_TIME;
    setAllMessages((prev) => [
      ...prev,
      {
        id: `msg-new-${sentSeq + 1}`,
        channelId: activeChannel.id,
        authorId: ME,
        text,
        sentAt,
        reactions: [],
      },
    ]);
    setSentSeq((n) => n + 1);
    setDraft('');
    toast({
      title: 'Message sent',
      description: `Posted to #${activeChannel.name}`,
      severity: 'success',
    });
  }

  function sendThreadReply(text: string) {
    const sentAt = NEW_MESSAGE_TIMES[sentSeq % NEW_MESSAGE_TIMES.length] ?? FALLBACK_TIME;
    setThreadReplies((prev) => [
      ...prev,
      { id: `thr-new-${prev.length + 1}`, authorId: ME, text, sentAt },
    ]);
    setSentSeq((n) => n + 1);
    toast({ title: 'Reply sent', description: 'Posted to thread', severity: 'success' });
  }

  /* ------------------------------ renderers ----------------------------- */

  function renderMessage(m: Message): ReactNode {
    const author = usersById[m.authorId];
    const mine = m.authorId === ME;
    const isThreadRoot = m.id === thread.rootMessageId;
    const myEmojis = m.reactions
      .filter((r) => r.userIds.includes(ME))
      .map((r) => r.emoji);
    const bar: UiReaction[] = m.reactions.map((r) => ({
      key: r.emoji,
      emoji: r.emoji,
      count: r.count,
      isReactedByMe: r.userIds.includes(ME),
      users: r.userIds.map(userName),
    }));

    return (
      <ChatBubble
        key={m.id}
        side={mine ? 'end' : 'start'}
        author={!mine ? author?.name : undefined}
        avatar={!mine && author ? <UserAvatar user={author} size="xs" /> : undefined}
        timestamp={m.edited ? `${timeOf(m.sentAt)} · edited` : timeOf(m.sentAt)}
        status={mine ? (m.id.startsWith('msg-new') ? 'sent' : 'read') : undefined}
        footer={
          <div className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
            <ReactionBar
              reactions={bar}
              onReact={(key) => toggleReaction(m.id, key)}
              onAdd={() => setPickerFor((p) => (p === m.id ? null : m.id))}
            />
            {pickerFor === m.id && (
              <ReactionPicker
                size="sm"
                selected={myEmojis}
                onSelect={(emoji) => {
                  toggleReaction(m.id, emoji);
                  setPickerFor(null);
                }}
              />
            )}
            {isThreadRoot && (
              <Button
                variant="ghost"
                tone="primary"
                size="xs"
                onClick={() => setThreadOpen(true)}
              >
                💬 {threadReplies.length} replies — view thread
              </Button>
            )}
          </div>
        }
      >
        {m.text}
      </ChatBubble>
    );
  }

  const stream: ReactNode[] = [];
  if (activeChannel && !search.trim()) {
    stream.push(
      <ChatBubble key="sys-join" tone="system">
        You joined #{activeChannel.name}
      </ChatBubble>,
    );
  }
  let lastDay = '';
  for (const m of visibleMessages) {
    const day = m.sentAt.slice(0, 10);
    if (day !== lastDay) {
      stream.push(<DaySeparator key={`sep-${day}`} label={dayLabel(day)} />);
      lastDay = day;
    }
    stream.push(renderMessage(m));
  }
  if (visibleMessages.length === 0) {
    stream.push(
      <div key="empty" className="py-8 text-center text-sm text-muted-foreground">
        No messages match “{search.trim()}”.
      </div>,
    );
  }

  const typistId = TYPIST_ID[activeChannelId] ?? 'usr-003';
  const memberUsers = (activeChannel?.memberIds ?? [])
    .map((id) => usersById[id])
    .filter((u): u is User => u !== undefined);
  const dmUsers = users.slice(1, 6);

  /* ------------------------------- layout ------------------------------- */

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[520px] gap-4">
      {/* Channel sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col rounded-lg border border-border bg-card md:flex">
        <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Channels
        </div>
        <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
          <List marker="none" spacing="tight">
            {channels.map((c) => {
              const active = c.id === activeChannelId;
              return (
                <ListItem
                  key={c.id}
                  onClick={() => selectChannel(c.id)}
                  className={`cursor-pointer rounded-md px-2 ${
                    active ? 'bg-muted font-medium' : 'hover:bg-muted'
                  }`}
                  leading={<span aria-hidden="true">#</span>}
                  trailing={
                    unread[c.id] ? (
                      <NotificationDot tone="primary" size="sm" hasPulse />
                    ) : (
                      <span className="text-xs tabular-nums">{c.memberIds.length}</span>
                    )
                  }
                >
                  {c.name}
                </ListItem>
              );
            })}
          </List>
          <div className="px-2 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Direct messages
          </div>
          <List marker="none" spacing="tight">
            {dmUsers.map((u) => (
              <ListItem
                key={u.id}
                className="rounded-md px-2"
                leading={<UserAvatar user={u} size="xs" />}
                trailing={<span className="text-xs">{u.role}</span>}
              >
                <span className="truncate">{u.name}</span>
              </ListItem>
            ))}
          </List>
        </ScrollArea>
      </aside>

      {/* Main channel pane */}
      <section className="flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-card">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>#{activeChannel?.name ?? 'channel'}</span>
              <NotificationDot tone="success" size="xs" aria-hidden="true" />
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {activeChannel?.topic}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AvatarGroup max={4} size="sm">
              {memberUsers.map((u) => (
                <Avatar key={u.id} name={u.name} canAutoColor />
              ))}
            </AvatarGroup>
            <SearchInput
              size="sm"
              placeholder="Search messages…"
              className="w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>
        </header>

        <MessageList
          className="min-h-0 flex-1"
          footer={
            <div className="flex flex-col gap-2">
              <div className="flex h-4 items-center px-1">
                {typingVisible && (
                  <TypingIndicator who={firstName(typistId)} size="sm" isSubtle />
                )}
              </div>
              <ChatComposer
                value={draft}
                onValueChange={setDraft}
                onSubmit={sendMessage}
                placeholder={`Message #${activeChannel?.name ?? 'channel'}`}
                leading={
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen} placement="top">
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        tone="neutral"
                        size="sm"
                        shape="square"
                        aria-label="Insert emoji"
                      >
                        🙂
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto" padding="sm">
                      <EmojiPicker
                        onSelect={(emoji) => {
                          setDraft((d) => d + emoji);
                          setEmojiOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                }
              />
            </div>
          }
        >
          {stream}
        </MessageList>
      </section>

      {/* Thread side panel — mounts only after "view thread" */}
      {threadOpen && threadRoot && (
        <aside className="hidden w-80 shrink-0 lg:block">
          <ThreadView
            subtitle={`in #${channels.find((c) => c.id === threadRoot.channelId)?.name ?? 'deploys'}`}
            onClose={() => setThreadOpen(false)}
            parent={
              <ChatBubble
                side="start"
                author={userName(threadRoot.authorId)}
                avatar={
                  usersById[threadRoot.authorId] ? (
                    <UserAvatar user={usersById[threadRoot.authorId] as User} size="xs" />
                  ) : undefined
                }
                timestamp={timeOf(threadRoot.sentAt)}
              >
                {threadRoot.text}
              </ChatBubble>
            }
            composer={<ChatComposer placeholder="Reply…" onSubmit={sendThreadReply} />}
          >
            {threadReplies.map((r) => {
              const author = usersById[r.authorId];
              const mine = r.authorId === ME;
              return (
                <ChatBubble
                  key={r.id}
                  side={mine ? 'end' : 'start'}
                  tone={mine ? 'primary' : 'subtle'}
                  author={!mine ? author?.name : undefined}
                  avatar={!mine && author ? <UserAvatar user={author} size="xs" /> : undefined}
                  timestamp={timeOf(r.sentAt)}
                  isTailless
                >
                  {r.text}
                </ChatBubble>
              );
            })}
          </ThreadView>
        </aside>
      )}
    </div>
  );
}
