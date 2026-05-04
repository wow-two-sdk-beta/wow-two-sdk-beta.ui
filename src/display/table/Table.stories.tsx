import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

const meta: Meta<typeof Table> = {
  title: 'Display/Table',
  component: Table,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table striped hoverable className="w-full">
      <Table.Caption>Recent invoices</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Invoice</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Method</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell className="font-medium">INV001</Table.Cell>
          <Table.Cell>Paid</Table.Cell>
          <Table.Cell>Credit Card</Table.Cell>
          <Table.Cell className="text-right">$250.00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell className="font-medium">INV002</Table.Cell>
          <Table.Cell>Pending</Table.Cell>
          <Table.Cell>PayPal</Table.Cell>
          <Table.Cell className="text-right">$150.00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell className="font-medium">INV003</Table.Cell>
          <Table.Cell>Unpaid</Table.Cell>
          <Table.Cell>Bank Transfer</Table.Cell>
          <Table.Cell className="text-right">$350.00</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell colSpan={3}>Total</Table.Cell>
          <Table.Cell className="text-right">$750.00</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>
  ),
};

export const Compact: Story = {
  render: () => (
    <Table density="compact" hoverable>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Key</Table.HeaderCell>
          <Table.HeaderCell>Value</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell>name</Table.Cell>
          <Table.Cell>@wow-two-beta/ui</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>version</Table.Cell>
          <Table.Cell>0.0.13</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
