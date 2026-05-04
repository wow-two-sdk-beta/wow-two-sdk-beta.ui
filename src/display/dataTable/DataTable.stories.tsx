import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './DataTable';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
}

const USERS: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', joinedAt: new Date('2024-01-15') },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'editor', joinedAt: new Date('2024-03-22') },
  { id: '3', name: 'Carol', email: 'carol@example.com', role: 'viewer', joinedAt: new Date('2024-05-10') },
  { id: '4', name: 'Dan', email: 'dan@example.com', role: 'editor', joinedAt: new Date('2024-07-04') },
];

const meta: Meta = {
  title: 'Display/DataTable',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <DataTable<User>
      columns={[
        { key: 'name', header: 'Name', accessor: (r) => r.name, sortable: true },
        { key: 'email', header: 'Email', accessor: (r) => r.email, sortable: true },
        {
          key: 'role',
          header: 'Role',
          accessor: (r) => r.role,
          sortable: true,
          cell: (r) => (
            <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-xs">
              {r.role}
            </span>
          ),
        },
        {
          key: 'joinedAt',
          header: 'Joined',
          accessor: (r) => r.joinedAt,
          cell: (r) => r.joinedAt.toLocaleDateString(),
          sortable: true,
          align: 'right',
        },
      ]}
      data={USERS}
      rowKey={(r) => r.id}
      onRowClick={(r) => alert(`Clicked ${r.name}`)}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable<User>
      columns={[
        { key: 'name', header: 'Name', accessor: (r) => r.name },
        { key: 'email', header: 'Email', accessor: (r) => r.email },
      ]}
      data={[]}
      rowKey={(r) => r.id}
    />
  ),
};
