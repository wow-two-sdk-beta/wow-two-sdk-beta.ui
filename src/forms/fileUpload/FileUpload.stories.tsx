import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileUpload, type FileRejection } from './FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'Forms/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  render: () => <div className="w-[28rem]"><FileUpload hint="Any format · drag in or click" /></div>,
};

export const ImagesOnly: Story = {
  render: () => (
    <div className="w-[28rem]">
      <FileUpload accept="image/*" multiple hint="Images only · up to 5 MB each" maxSize={5 * 1024 * 1024} />
    </div>
  ),
};

export const WithList: Story = {
  render: () => {
    function Demo() {
      const [files, setFiles] = useState<File[]>([]);
      const [rejected, setRejected] = useState<FileRejection[]>([]);
      return (
        <div className="w-[28rem]">
          <FileUpload
            multiple
            accept=".pdf,.txt,image/*"
            maxSize={2 * 1024 * 1024}
            maxFiles={3}
            hint="PDF, TXT or images · max 2 MB · up to 3 files"
            onFilesChange={(a, r) => {
              setFiles((prev) => [...prev, ...a]);
              setRejected(r);
            }}
          >
            {files.length > 0 && (
              <ul className="space-y-1 text-sm">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-1.5">
                    <span className="truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                  </li>
                ))}
              </ul>
            )}
            {rejected.length > 0 && (
              <ul className="space-y-1 text-xs text-destructive">
                {rejected.map((r, i) => (
                  <li key={i}>
                    {r.file.name} — rejected ({r.reason})
                  </li>
                ))}
              </ul>
            )}
          </FileUpload>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Disabled: Story = {
  render: () => <div className="w-[28rem]"><FileUpload disabled hint="Upload disabled" /></div>,
};

export const Invalid: Story = {
  render: () => <div className="w-[28rem]"><FileUpload invalid hint="At least one file required" /></div>,
};
