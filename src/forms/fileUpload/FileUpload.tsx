import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export type FileRejectionReason = 'type' | 'size' | 'count';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export interface FileUploadProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'children' | 'size'
  > {
  /** Per-file byte cap. Files exceeding this drop into `rejected`. */
  maxSize?: number;
  /** Cap total accepted files (multiple mode). Excess go to `rejected`. */
  maxFiles?: number;
  onFilesChange?: (accepted: File[], rejected: FileRejection[]) => void;
  invalid?: boolean;
  label?: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return true;
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith('.')) return fileName.endsWith(t);
    if (t.endsWith('/*')) return fileType.startsWith(t.slice(0, -1));
    return fileType === t;
  });
}

/**
 * Drag-drop file zone with click-to-pick fallback. Validates against
 * `accept`, `maxSize`, and `maxFiles`. Emits accepted + rejected lists via
 * `onFilesChange`. The zone itself is a `role="button"` — Enter/Space opens
 * the native file picker.
 */
export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  {
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    onFilesChange,
    disabled,
    invalid,
    label = 'Drop files here, or click to browse',
    hint,
    children,
    className,
    name,
    ...rest
  },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);
  const dragCounter = useRef(0);
  const [dragState, setDragState] = useState<'idle' | 'over' | 'reject'>('idle');

  const partition = useCallback(
    (files: FileList | File[]): [File[], FileRejection[]] => {
      const accepted: File[] = [];
      const rejected: FileRejection[] = [];
      const arr = Array.from(files);
      for (const f of arr) {
        if (!matchesAccept(f, accept)) {
          rejected.push({ file: f, reason: 'type' });
          continue;
        }
        if (maxSize != null && f.size > maxSize) {
          rejected.push({ file: f, reason: 'size' });
          continue;
        }
        accepted.push(f);
      }
      if (maxFiles != null && accepted.length > maxFiles) {
        const overflow = accepted.splice(maxFiles);
        for (const f of overflow) rejected.push({ file: f, reason: 'count' });
      }
      return [accepted, rejected];
    },
    [accept, maxSize, maxFiles],
  );

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    dragCounter.current += 1;
    const items = e.dataTransfer?.items;
    let reject = false;
    if (items && (accept || maxSize)) {
      // We can only inspect type at dragenter — size is not exposed pre-drop.
      if (accept) {
        const tokens = accept.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (!it || it.kind !== 'file') continue;
          const t = it.type.toLowerCase();
          const ok = tokens.some((tk) => {
            if (tk.startsWith('.')) return false; // can't check extension here
            if (tk.endsWith('/*')) return t.startsWith(tk.slice(0, -1));
            return t === tk;
          });
          if (!ok) {
            reject = true;
            break;
          }
        }
      }
    }
    setDragState(reject ? 'reject' : 'over');
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragState('idle');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    dragCounter.current = 0;
    setDragState('idle');
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const [accepted, rejected] = partition(files);
    onFilesChange?.(accepted, rejected);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  const showError = invalid || dragState === 'reject';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        data-drag-state={dragState}
        data-invalid={showError || undefined}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background px-6 py-10 text-center text-sm text-muted-foreground transition-colors',
          'hover:border-border-strong hover:bg-muted/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          dragState === 'over' && 'border-primary bg-primary-soft/30 text-foreground',
          showError && 'border-destructive bg-destructive-soft/30 text-destructive',
          disabled && 'cursor-not-allowed opacity-60 hover:border-input hover:bg-background',
        )}
      >
        <Icon
          icon={UploadCloud}
          size={28}
          className={cn(
            'text-muted-foreground',
            dragState === 'over' && 'text-primary',
            showError && 'text-destructive',
          )}
        />
        <div className="font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs">{hint}</div>}
        <input
          {...rest}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          name={name}
          className="sr-only"
          onChange={(e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            const [accepted, rejected] = partition(files);
            onFilesChange?.(accepted, rejected);
            // reset so picking the same file again still fires
            e.target.value = '';
          }}
        />
      </div>
      {children}
    </div>
  );
});
FileUpload.displayName = 'FileUpload';
