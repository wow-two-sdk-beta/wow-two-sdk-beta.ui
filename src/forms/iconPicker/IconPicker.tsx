import {
  forwardRef,
  useMemo,
  useState,
  type ComponentType,
  type HTMLAttributes,
  type SVGAttributes,
} from 'react';
import {
  Bell,
  Bookmark,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Cloud,
  Code,
  Coffee,
  Compass,
  Download,
  Edit,
  ExternalLink,
  Eye,
  File,
  Folder,
  Globe,
  Heart,
  Home,
  Image,
  Inbox,
  Info,
  Layers,
  Lightbulb,
  Link2,
  Lock,
  Mail,
  Map,
  MessageCircle,
  Mic,
  Moon,
  Music,
  Paperclip,
  Pencil,
  Phone,
  Pin,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  ShoppingCart,
  Star,
  Sun,
  Tag,
  Trash,
  Upload,
  User,
  Video,
  Wallet,
  Zap,
} from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';
import { inputBaseVariants } from '../InputStyles';

type IconComponent = ComponentType<SVGAttributes<SVGSVGElement>>;

const BUILT_IN_ICONS: Record<string, IconComponent> = {
  bell: Bell,
  bookmark: Bookmark,
  calendar: Calendar,
  camera: Camera,
  check: Check,
  'chevron-down': ChevronDown,
  clock: Clock,
  cloud: Cloud,
  code: Code,
  coffee: Coffee,
  compass: Compass,
  download: Download,
  edit: Edit,
  'external-link': ExternalLink,
  eye: Eye,
  file: File,
  folder: Folder,
  globe: Globe,
  heart: Heart,
  home: Home,
  image: Image,
  inbox: Inbox,
  info: Info,
  layers: Layers,
  lightbulb: Lightbulb,
  link: Link2,
  lock: Lock,
  mail: Mail,
  map: Map,
  message: MessageCircle,
  mic: Mic,
  moon: Moon,
  music: Music,
  paperclip: Paperclip,
  pencil: Pencil,
  phone: Phone,
  pin: Pin,
  play: Play,
  plus: Plus,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  cart: ShoppingCart,
  star: Star,
  sun: Sun,
  tag: Tag,
  trash: Trash,
  upload: Upload,
  user: User,
  video: Video,
  wallet: Wallet,
  zap: Zap,
};

export interface IconPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (name: string) => void;
  icons?: Record<string, IconComponent>;
  columns?: number;
  size?: number;
  iconButtonSize?: number;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

/**
 * Searchable icon-picker grid. Built-in 50+ icon subset from `lucide-react`;
 * pass your own `icons` map to override.
 */
export const IconPicker = forwardRef<HTMLDivElement, IconPickerProps>(
  function IconPicker(
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      icons = BUILT_IN_ICONS,
      columns = 8,
      size = 20,
      iconButtonSize = 36,
      placeholder = 'Search icons…',
      disabled,
      name,
      className,
      ...rest
    },
    ref,
  ) {
    const [value, setValue] = useControlled<string>({
      controlled: valueProp,
      default: defaultValue ?? '',
      onChange: onValueChange,
    });
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
      const entries = Object.entries(icons);
      if (!query) return entries;
      const q = query.toLowerCase();
      return entries.filter(([key]) => key.toLowerCase().includes(q));
    }, [icons, query]);

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm',
          className,
        )}
        {...rest}
      >
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(inputBaseVariants({ size: 'sm' }))}
        />
        <div
          role="grid"
          aria-label="Icons"
          className="grid gap-1 overflow-y-auto"
          style={{ gridTemplateColumns: `repeat(${columns}, ${iconButtonSize}px)`, maxHeight: 240 }}
        >
          {filtered.map(([key, IconComp]) => {
            const selected = value === key;
            return (
              <div role="gridcell" key={key}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={key}
                  disabled={disabled}
                  onClick={() => setValue(key)}
                  style={{ width: iconButtonSize, height: iconButtonSize }}
                  className={cn(
                    'inline-flex items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary'
                      : 'border-transparent',
                  )}
                >
                  <Icon icon={IconComp} size={size} />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full px-2 py-6 text-center text-xs text-muted-foreground">
              No icons match.
            </div>
          )}
        </div>
        {name && <input type="hidden" name={name} value={value} />}
      </div>
    );
  },
);
