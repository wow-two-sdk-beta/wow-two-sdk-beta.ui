import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Editable, EditableCancel, EditableInput, EditablePreview, EditableSubmit } from './Editable';

const meta: Meta = {
  title: 'Forms/Editable',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Editable defaultValue="Click to edit">
      <EditablePreview />
      <EditableInput size="sm" />
    </Editable>
  ),
};

export const WithButtons: Story = {
  render: () => (
    <Editable defaultValue="Inline title" submitOnBlur={false}>
      <EditablePreview />
      <EditableInput size="sm" />
      <EditableSubmit />
      <EditableCancel />
    </Editable>
  ),
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [v, setV] = useState('Hello');
      return (
        <div className="space-y-2">
          <Editable value={v} onValueChange={setV}>
            <EditablePreview />
            <EditableInput size="sm" />
          </Editable>
          <p className="text-xs text-muted-foreground">
            committed: <code>{v}</code>
          </p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Empty: Story = {
  render: () => (
    <Editable defaultValue="" placeholder="Add a note…">
      <EditablePreview />
      <EditableInput size="sm" />
    </Editable>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Editable defaultValue="Locked" disabled>
      <EditablePreview />
      <EditableInput size="sm" />
    </Editable>
  ),
};
