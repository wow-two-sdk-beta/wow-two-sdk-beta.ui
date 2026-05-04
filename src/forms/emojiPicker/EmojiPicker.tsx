import { forwardRef, useMemo, useRef, useState, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { inputBaseVariants } from '../InputStyles';

export interface EmojiEntry {
  emoji: string;
  name: string;
  keywords?: string[];
}

export interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
  emojis: EmojiEntry[];
}

const EMOJI: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    icon: '😀',
    emojis: [
      { emoji: '😀', name: 'grinning face' },
      { emoji: '😃', name: 'grinning with big eyes' },
      { emoji: '😄', name: 'grinning, smiling eyes' },
      { emoji: '😁', name: 'beaming face' },
      { emoji: '😆', name: 'squinting face' },
      { emoji: '😅', name: 'sweat smile' },
      { emoji: '🤣', name: 'rolling on the floor laughing' },
      { emoji: '😂', name: 'face with tears of joy' },
      { emoji: '🙂', name: 'slight smile' },
      { emoji: '🙃', name: 'upside-down face' },
      { emoji: '😉', name: 'wink' },
      { emoji: '😊', name: 'blushing smile' },
      { emoji: '😇', name: 'halo' },
      { emoji: '🥰', name: 'smile with hearts' },
      { emoji: '😍', name: 'heart eyes' },
      { emoji: '🤩', name: 'star eyes' },
      { emoji: '😘', name: 'kiss' },
      { emoji: '😗', name: 'kissing face' },
      { emoji: '🤔', name: 'thinking' },
      { emoji: '😐', name: 'neutral' },
      { emoji: '😑', name: 'expressionless' },
      { emoji: '😶', name: 'no mouth' },
      { emoji: '🙄', name: 'eye roll' },
      { emoji: '😏', name: 'smirk' },
      { emoji: '😒', name: 'unamused' },
      { emoji: '😞', name: 'disappointed' },
      { emoji: '😔', name: 'pensive' },
      { emoji: '😟', name: 'worried' },
      { emoji: '😕', name: 'confused' },
      { emoji: '🙁', name: 'slight frown' },
      { emoji: '😣', name: 'persevering' },
      { emoji: '😖', name: 'confounded' },
      { emoji: '😫', name: 'tired' },
      { emoji: '😩', name: 'weary' },
      { emoji: '🥺', name: 'pleading' },
      { emoji: '😢', name: 'crying' },
      { emoji: '😭', name: 'loudly crying' },
      { emoji: '😡', name: 'pouting' },
      { emoji: '😠', name: 'angry' },
      { emoji: '🤬', name: 'cursing' },
      { emoji: '🥶', name: 'cold' },
      { emoji: '🥵', name: 'hot' },
      { emoji: '😳', name: 'flushed' },
      { emoji: '🤯', name: 'mind blown' },
      { emoji: '😱', name: 'screaming' },
      { emoji: '😨', name: 'fearful' },
      { emoji: '😰', name: 'anxious' },
      { emoji: '🥱', name: 'yawning' },
      { emoji: '😴', name: 'sleeping' },
      { emoji: '🤤', name: 'drooling' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: '👍',
    emojis: [
      { emoji: '👍', name: 'thumbs up' },
      { emoji: '👎', name: 'thumbs down' },
      { emoji: '👌', name: 'OK' },
      { emoji: '✌️', name: 'victory' },
      { emoji: '🤞', name: 'crossed fingers' },
      { emoji: '🤟', name: 'love-you' },
      { emoji: '🤘', name: 'rock on' },
      { emoji: '🤙', name: 'call me' },
      { emoji: '👈', name: 'point left' },
      { emoji: '👉', name: 'point right' },
      { emoji: '👆', name: 'point up' },
      { emoji: '👇', name: 'point down' },
      { emoji: '☝️', name: 'index up' },
      { emoji: '✋', name: 'raised hand' },
      { emoji: '🖐️', name: 'hand fingers splayed' },
      { emoji: '🖖', name: 'vulcan' },
      { emoji: '👋', name: 'wave' },
      { emoji: '🤚', name: 'back of hand' },
      { emoji: '👏', name: 'clap' },
      { emoji: '🙌', name: 'raising hands' },
      { emoji: '🤝', name: 'handshake' },
      { emoji: '🙏', name: 'pray' },
      { emoji: '💪', name: 'flexed bicep' },
      { emoji: '👀', name: 'eyes' },
      { emoji: '👤', name: 'silhouette' },
      { emoji: '👥', name: 'silhouettes' },
      { emoji: '🧑', name: 'person' },
      { emoji: '👶', name: 'baby' },
      { emoji: '🧒', name: 'child' },
      { emoji: '👦', name: 'boy' },
      { emoji: '👧', name: 'girl' },
      { emoji: '🧓', name: 'older person' },
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌳',
    emojis: [
      { emoji: '🐶', name: 'dog' },
      { emoji: '🐱', name: 'cat' },
      { emoji: '🐭', name: 'mouse' },
      { emoji: '🐹', name: 'hamster' },
      { emoji: '🐰', name: 'rabbit' },
      { emoji: '🦊', name: 'fox' },
      { emoji: '🐻', name: 'bear' },
      { emoji: '🐼', name: 'panda' },
      { emoji: '🐨', name: 'koala' },
      { emoji: '🐯', name: 'tiger' },
      { emoji: '🦁', name: 'lion' },
      { emoji: '🐮', name: 'cow' },
      { emoji: '🐷', name: 'pig' },
      { emoji: '🐸', name: 'frog' },
      { emoji: '🐵', name: 'monkey' },
      { emoji: '🐔', name: 'chicken' },
      { emoji: '🐧', name: 'penguin' },
      { emoji: '🐦', name: 'bird' },
      { emoji: '🐤', name: 'baby chick' },
      { emoji: '🦆', name: 'duck' },
      { emoji: '🦅', name: 'eagle' },
      { emoji: '🦉', name: 'owl' },
      { emoji: '🌸', name: 'cherry blossom' },
      { emoji: '🌹', name: 'rose' },
      { emoji: '🌻', name: 'sunflower' },
      { emoji: '🌷', name: 'tulip' },
      { emoji: '🌼', name: 'daisy' },
      { emoji: '🌳', name: 'tree' },
      { emoji: '🌲', name: 'evergreen' },
      { emoji: '🌴', name: 'palm' },
      { emoji: '🌵', name: 'cactus' },
      { emoji: '🍀', name: 'four-leaf clover' },
      { emoji: '☀️', name: 'sun' },
      { emoji: '🌙', name: 'moon' },
      { emoji: '⭐', name: 'star' },
      { emoji: '⚡', name: 'lightning' },
      { emoji: '🔥', name: 'fire' },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍕',
    emojis: [
      { emoji: '🍎', name: 'apple' },
      { emoji: '🍊', name: 'orange' },
      { emoji: '🍌', name: 'banana' },
      { emoji: '🍇', name: 'grapes' },
      { emoji: '🍓', name: 'strawberry' },
      { emoji: '🍉', name: 'watermelon' },
      { emoji: '🍒', name: 'cherries' },
      { emoji: '🍑', name: 'peach' },
      { emoji: '🍍', name: 'pineapple' },
      { emoji: '🥑', name: 'avocado' },
      { emoji: '🍅', name: 'tomato' },
      { emoji: '🥕', name: 'carrot' },
      { emoji: '🌽', name: 'corn' },
      { emoji: '🥬', name: 'leafy green' },
      { emoji: '🍞', name: 'bread' },
      { emoji: '🥐', name: 'croissant' },
      { emoji: '🥯', name: 'bagel' },
      { emoji: '🥖', name: 'baguette' },
      { emoji: '🧀', name: 'cheese' },
      { emoji: '🥚', name: 'egg' },
      { emoji: '🍳', name: 'cooking' },
      { emoji: '🥞', name: 'pancakes' },
      { emoji: '🥓', name: 'bacon' },
      { emoji: '🍔', name: 'burger' },
      { emoji: '🍟', name: 'fries' },
      { emoji: '🍕', name: 'pizza' },
      { emoji: '🌭', name: 'hotdog' },
      { emoji: '🌮', name: 'taco' },
      { emoji: '🌯', name: 'burrito' },
      { emoji: '🍣', name: 'sushi' },
      { emoji: '🍰', name: 'cake' },
      { emoji: '🧁', name: 'cupcake' },
      { emoji: '🍩', name: 'donut' },
      { emoji: '🍪', name: 'cookie' },
      { emoji: '🍫', name: 'chocolate' },
      { emoji: '🍯', name: 'honey' },
      { emoji: '☕', name: 'coffee' },
      { emoji: '🍵', name: 'tea' },
      { emoji: '🍺', name: 'beer' },
      { emoji: '🍷', name: 'wine' },
    ],
  },
  {
    id: 'objects',
    label: 'Objects',
    icon: '💡',
    emojis: [
      { emoji: '💡', name: 'lightbulb' },
      { emoji: '🔋', name: 'battery' },
      { emoji: '📱', name: 'phone' },
      { emoji: '💻', name: 'laptop' },
      { emoji: '🖥️', name: 'desktop' },
      { emoji: '⌨️', name: 'keyboard' },
      { emoji: '🖱️', name: 'mouse' },
      { emoji: '📷', name: 'camera' },
      { emoji: '🎥', name: 'video camera' },
      { emoji: '📺', name: 'tv' },
      { emoji: '📻', name: 'radio' },
      { emoji: '🎙️', name: 'microphone' },
      { emoji: '🔊', name: 'speaker loud' },
      { emoji: '🔈', name: 'speaker' },
      { emoji: '📢', name: 'megaphone' },
      { emoji: '🔔', name: 'bell' },
      { emoji: '🔇', name: 'muted' },
      { emoji: '⏰', name: 'alarm' },
      { emoji: '⌚', name: 'watch' },
      { emoji: '📅', name: 'calendar' },
      { emoji: '📌', name: 'pin' },
      { emoji: '✂️', name: 'scissors' },
      { emoji: '🔑', name: 'key' },
      { emoji: '🔒', name: 'locked' },
      { emoji: '🔓', name: 'unlocked' },
      { emoji: '💰', name: 'money bag' },
      { emoji: '💳', name: 'card' },
      { emoji: '📦', name: 'package' },
      { emoji: '✉️', name: 'envelope' },
      { emoji: '📨', name: 'incoming envelope' },
      { emoji: '✏️', name: 'pencil' },
      { emoji: '🖊️', name: 'pen' },
      { emoji: '📝', name: 'memo' },
      { emoji: '📎', name: 'paperclip' },
      { emoji: '📁', name: 'folder' },
      { emoji: '📂', name: 'open folder' },
      { emoji: '📊', name: 'bar chart' },
      { emoji: '📈', name: 'up chart' },
      { emoji: '📉', name: 'down chart' },
    ],
  },
  {
    id: 'symbols',
    label: 'Symbols',
    icon: '✅',
    emojis: [
      { emoji: '✅', name: 'check' },
      { emoji: '❌', name: 'cross' },
      { emoji: '❗', name: 'exclamation' },
      { emoji: '❓', name: 'question' },
      { emoji: '⚠️', name: 'warning' },
      { emoji: '✨', name: 'sparkles' },
      { emoji: '⭐', name: 'star' },
      { emoji: '🌟', name: 'glowing star' },
      { emoji: '💫', name: 'dizzy' },
      { emoji: '💢', name: 'anger' },
      { emoji: '💥', name: 'collision' },
      { emoji: '💦', name: 'sweat drops' },
      { emoji: '💨', name: 'dash' },
      { emoji: '🎉', name: 'party' },
      { emoji: '🎊', name: 'confetti ball' },
      { emoji: '🎁', name: 'gift' },
      { emoji: '🏆', name: 'trophy' },
      { emoji: '🥇', name: 'gold medal' },
      { emoji: '🥈', name: 'silver medal' },
      { emoji: '🥉', name: 'bronze medal' },
      { emoji: '❤️', name: 'red heart' },
      { emoji: '🧡', name: 'orange heart' },
      { emoji: '💛', name: 'yellow heart' },
      { emoji: '💚', name: 'green heart' },
      { emoji: '💙', name: 'blue heart' },
      { emoji: '💜', name: 'purple heart' },
      { emoji: '🖤', name: 'black heart' },
      { emoji: '🤍', name: 'white heart' },
      { emoji: '💔', name: 'broken heart' },
      { emoji: '➕', name: 'plus' },
      { emoji: '➖', name: 'minus' },
      { emoji: '➗', name: 'divide' },
      { emoji: '✖️', name: 'multiply' },
      { emoji: '♻️', name: 'recycle' },
      { emoji: '⚡', name: 'lightning' },
    ],
  },
];

export interface EmojiPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  onSelect: (emoji: string) => void;
  placeholder?: string;
  columns?: number;
  cellSize?: number;
  categories?: EmojiCategory[];
  disabled?: boolean;
}

/**
 * Emoji picker with category jump strip + search. Built-in ~200 emoji
 * subset; pass `categories` to override. Designed for use inside `Popover`.
 */
export const EmojiPicker = forwardRef<HTMLDivElement, EmojiPickerProps>(
  function EmojiPicker(
    {
      onSelect,
      placeholder = 'Search emoji…',
      columns = 8,
      cellSize = 28,
      categories = EMOJI,
      disabled,
      className,
      ...rest
    },
    ref,
  ) {
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement | null>(null);

    const matches = useMemo(() => {
      if (!query) return null;
      const q = query.toLowerCase();
      const found: EmojiEntry[] = [];
      for (const cat of categories) {
        for (const e of cat.emojis) {
          if (e.name.includes(q) || (e.keywords?.some((k) => k.includes(q)) ?? false)) {
            found.push(e);
          }
        }
      }
      return found;
    }, [query, categories]);

    const jumpTo = (id: string) => {
      const root = containerRef.current;
      if (!root) return;
      const target = root.querySelector(`[data-cat="${id}"]`);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <div
        ref={(el) => {
          containerRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={cn(
          'flex flex-col rounded-md border border-border bg-card text-card-foreground shadow-sm',
          disabled && 'opacity-60',
          className,
        )}
        style={{ width: columns * cellSize + 24 }}
        {...rest}
      >
        <div className="border-b border-border p-2">
          <input
            type="search"
            value={query}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(inputBaseVariants({ size: 'sm' }))}
          />
        </div>
        {!matches && (
          <div role="tablist" aria-label="Emoji categories" className="flex border-b border-border">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-controls={`emoji-cat-${c.id}`}
                onClick={() => jumpTo(c.id)}
                title={c.label}
                className="flex flex-1 items-center justify-center py-1.5 text-base hover:bg-muted"
              >
                <span aria-hidden="true">{c.icon}</span>
                <span className="sr-only">{c.label}</span>
              </button>
            ))}
          </div>
        )}
        <div
          role="grid"
          aria-label="Emoji"
          className="overflow-y-auto p-2"
          style={{ maxHeight: 280 }}
        >
          {matches ? (
            matches.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">No emoji match.</div>
            ) : (
              <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, ${cellSize}px)` }}>
                {matches.map((e) => (
                  <EmojiCell key={e.emoji} entry={e} cellSize={cellSize} disabled={disabled} onSelect={onSelect} />
                ))}
              </div>
            )
          ) : (
            categories.map((cat) => (
              <div key={cat.id} data-cat={cat.id} id={`emoji-cat-${cat.id}`} className="mb-3">
                <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat.label}
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, ${cellSize}px)` }}>
                  {cat.emojis.map((e) => (
                    <EmojiCell key={e.emoji} entry={e} cellSize={cellSize} disabled={disabled} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);

interface EmojiCellProps {
  entry: EmojiEntry;
  cellSize: number;
  disabled?: boolean;
  onSelect: (emoji: string) => void;
}

function EmojiCell({ entry, cellSize, disabled, onSelect }: EmojiCellProps) {
  return (
    <div role="gridcell">
      <button
        type="button"
        aria-label={entry.name}
        disabled={disabled}
        onClick={() => onSelect(entry.emoji)}
        style={{ width: cellSize, height: cellSize }}
        className="inline-flex items-center justify-center rounded-md text-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {entry.emoji}
      </button>
    </div>
  );
}

export const BUILT_IN_EMOJI = EMOJI;
