import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Paperclip, Smile } from 'lucide-react';
import { ChatComposer } from './ChatComposer';

const meta: Meta<typeof ChatComposer> = {
  title: 'Forms/ChatComposer',
  component: ChatComposer,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ChatComposer>;

export const Default: Story = { args: {} };

export const WithToolbar: Story = {
  args: {
    leading: (
      <button
        type="button"
        aria-label="Attach"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <Paperclip className="h-4 w-4" />
      </button>
    ),
    trailing: (
      <button
        type="button"
        aria-label="Insert emoji"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <Smile className="h-4 w-4" />
      </button>
    ),
  },
};

export const ModEnterToSend: Story = {
  args: { submitOn: 'mod-enter', placeholder: 'Cmd/Ctrl+Enter to send…' },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Read-only conversation' },
};

function ControlledDemo() {
  const [v, setV] = useState('');
  const [log, setLog] = useState<string[]>([]);
  return (
    <div className="flex w-[480px] flex-col gap-3">
      <ChatComposer
        value={v}
        onValueChange={setV}
        onSubmit={(text) => setLog((prev) => [...prev, text])}
      />
      <ul className="text-xs text-muted-foreground">
        {log.map((m, i) => (
          <li key={i}>· {m}</li>
        ))}
      </ul>
    </div>
  );
}

export const Controlled: Story = { render: () => <ControlledDemo /> };
