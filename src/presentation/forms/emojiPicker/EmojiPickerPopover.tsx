import { type ReactNode } from 'react';

import { ColorTone, SizePreset } from '../../../foundation/utils';
import { type EmojiCatalogEntry } from '../../../domain/emoji';
import { useControlled } from '../../../foundation/hooks';
import { Button, ButtonShape, ButtonVariant } from '../../actions';
import { Popover, PopoverContent, PopoverTrigger, type PopoverProps } from '../../overlays/popover';

import { EmojiPicker, type EmojiPickerProps } from './EmojiPicker';

/** Defines props for the popover-hosted emoji picker. */
export interface EmojiPickerPopoverProps extends Omit<EmojiPickerProps, 'value' | 'onChange'> {
  /** The current emoji catalog entry, or `null` for none. */
  readonly value: EmojiCatalogEntry | null;

  /** Emits the picked entry (or `null` on clear); a non-null pick also closes the popover. */
  readonly onChange: (entry: EmojiCatalogEntry | null) => void;

  /** A custom trigger, replacing the default emoji-icon `Button`. `children` is an alias. */
  readonly trigger?: ReactNode;

  /** A custom trigger (alias of `trigger`). */
  readonly children?: ReactNode;

  /** The popover placement relative to the trigger. Default `bottom`. */
  readonly placement?: PopoverProps['placement'];

  /** The controlled open state. */
  readonly open?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  readonly defaultOpen?: boolean;

  /** Fires when the open state changes. */
  readonly onOpenChange?: (open: boolean) => void;
}

/**
 * Popover-hosted `EmojiPicker` — a chat/toolbar-friendly variant. A trigger opens a `Popover` holding the
 * full `EmojiPicker`; picking an entry emits it via `onChange` (consumers read `entry.glyph`) and closes the
 * popover. Size is out of scope here — compose `EmojiSizeControl` separately when a host needs a per-emoji scale.
 */
export function EmojiPickerPopover({
  value,
  onChange,
  trigger,
  children,
  placement = 'bottom',
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...pickerProps
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useControlled<boolean>({
    controlled: openProp,
    default: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  // The default trigger must be a real element (not a wrapper component) so `PopoverTrigger asChild`
  // can merge its click/ref onto the underlying `Button` — a function component would swallow them.
  const triggerNode = trigger ?? children ?? (
    <Button
      variant={ButtonVariant.Ghost}
      tone={ColorTone.Neutral}
      size={SizePreset.Sm}
      shape={ButtonShape.Square}
      aria-label="Choose emoji"
    >
      {value?.glyph ?? '🙂'}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen} placement={placement}>
      <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>
      <PopoverContent className="w-80" padding="sm">
        <EmojiPicker
          {...pickerProps}
          value={value}
          onChange={(entry) => {
            onChange(entry);
            if (entry !== null) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
