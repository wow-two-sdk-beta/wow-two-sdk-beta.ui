import { forwardRef, useMemo, useState, type HTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays/popover';

export interface FontOption {
  name: string;
  family: string;
  sample?: string;
}

export const BUILT_IN_FONTS: FontOption[] = [
  { name: 'System Sans', family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { name: 'System Serif', family: 'ui-serif, Cambria, Georgia, "Times New Roman", serif' },
  { name: 'System Mono', family: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { name: 'Times', family: '"Times New Roman", Times, serif' },
  { name: 'Courier', family: '"Courier New", Courier, monospace' },
  { name: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
  { name: 'Verdana', family: 'Verdana, Geneva, Tahoma, sans-serif' },
  { name: 'Tahoma', family: 'Tahoma, Geneva, Verdana, sans-serif' },
  { name: 'Trebuchet', family: '"Trebuchet MS", Helvetica, sans-serif' },
  { name: 'Garamond', family: 'Garamond, "Times New Roman", serif' },
  { name: 'Comic Sans', family: '"Comic Sans MS", "Comic Sans", cursive' },
  { name: 'Impact', family: 'Impact, "Arial Narrow", sans-serif' },
];

export interface FontPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (family: string) => void;
  fonts?: FontOption[];
  placeholder?: string;
  previewText?: string;
  disabled?: boolean;
  name?: string;
}

/**
 * Font-family picker with live preview. Each option row renders in its own
 * font face. Wraps `overlays/Popover` for the dropdown.
 */
export const FontPicker = forwardRef<HTMLDivElement, FontPickerProps>(
  function FontPicker(
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      fonts = BUILT_IN_FONTS,
      placeholder = 'Select font…',
      previewText = 'The quick brown fox',
      disabled,
      name,
      className,
      ...rest
    },
    ref,
  ) {
    const [value, setValue] = useControlled<string>({
      controlled: valueProp,
      default: defaultValue ?? fonts[0]?.family ?? '',
      onChange: onValueChange,
    });
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
      if (!query) return fonts;
      const q = query.toLowerCase();
      return fonts.filter((f) => f.name.toLowerCase().includes(q));
    }, [fonts, query]);

    const current = fonts.find((f) => f.family === value);

    return (
      <div ref={ref} className={cn('inline-block', className)} {...rest}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-haspopup="listbox"
              aria-expanded={open}
              className={cn(
                'inline-flex h-10 min-w-[14rem] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              <span style={{ fontFamily: value }} className="truncate text-foreground">
                {current?.name ?? placeholder}
              </span>
              <Icon icon={ChevronDown} size={14} className="text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent bare className="w-[20rem] p-2">
            <input
              type="search"
              autoFocus
              value={query}
              placeholder="Search fonts…"
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2 h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div role="listbox" aria-label="Fonts" className="max-h-72 overflow-y-auto">
              {filtered.map((f) => {
                const selected = f.family === value;
                return (
                  <button
                    key={f.name}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setValue(f.family);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                      selected && 'bg-primary-soft text-primary-soft-foreground',
                    )}
                  >
                    <span className="font-medium">{f.name}</span>
                    <span style={{ fontFamily: f.family }} className="ml-3 truncate text-xs text-muted-foreground">
                      {f.sample ?? previewText}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-2 py-6 text-center text-xs text-muted-foreground">No fonts match.</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {name && <input type="hidden" name={name} value={value} />}
      </div>
    );
  },
);
