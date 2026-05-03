import { forwardRef, useImperativeHandle, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export interface FilePickerProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'onChange' | 'size'> {
  /** Button label. Default `"Choose file"`. */
  label?: ReactNode;
  /** Fires with the chosen FileList when files are picked. */
  onFilesChange?: (files: FileList | null) => void;
  /** Filename(s) preview rendered next to the button. Pass `null` to hide. */
  preview?: ReactNode;
  /** Visual size of the button. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<FilePickerProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/**
 * Basic file picker — styled trigger button + visually-hidden native
 * `<input type="file">`. For drag-drop / preview / progress, use the L5
 * `Dropzone` organism (planned).
 */
export const FilePicker = forwardRef<HTMLInputElement, FilePickerProps>(
  ({ label = 'Choose file', onFilesChange, preview, size = 'md', className, disabled, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    return (
      <div className={cn('inline-flex items-center gap-3', className)}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border border-input bg-background font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            SIZE[size],
          )}
        >
          <Icon icon={Upload} size={16} />
          {label}
        </button>
        <input
          ref={inputRef}
          type="file"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => onFilesChange?.(e.target.files)}
          {...props}
        />
        {preview && <span className="truncate text-sm text-muted-foreground">{preview}</span>}
      </div>
    );
  },
);
FilePicker.displayName = 'FilePicker';
