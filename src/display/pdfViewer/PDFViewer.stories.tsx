import type { Meta, StoryObj } from '@storybook/react';
import { PDFViewer } from './PDFViewer';

const meta: Meta<typeof PDFViewer> = {
  title: 'Display/PDFViewer',
  component: PDFViewer,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PDFViewer>;

// W3C-published sample PDF.
const SAMPLE_PDF = 'https://www.w3.org/WAI/WCAG21/working-examples/pdf-table/table.pdf';

export const Default: Story = {
  render: () => (
    <div className="w-[48rem]">
      <PDFViewer src={SAMPLE_PDF} title="WCAG sample PDF" />
    </div>
  ),
};

export const WithPageCount: Story = {
  render: () => (
    <div className="w-[48rem]">
      <PDFViewer src={SAMPLE_PDF} pageCount={3} title="WCAG sample PDF" />
    </div>
  ),
};
