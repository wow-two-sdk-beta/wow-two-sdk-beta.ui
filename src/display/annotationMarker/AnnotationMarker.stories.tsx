import type { Meta, StoryObj } from '@storybook/react';
import { AnnotationMarker } from './AnnotationMarker';

const meta: Meta<typeof AnnotationMarker> = {
  title: 'Display/AnnotationMarker',
  component: AnnotationMarker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AnnotationMarker>;

export const InlineComment: Story = {
  args: { children: 'this paragraph', index: 1, tone: 'comment' },
};

export const InlineSuggestion: Story = {
  args: { children: 'rewrite this line', index: 2, tone: 'suggestion' },
};

export const InlineIssue: Story = {
  args: { children: 'this number is wrong', index: 3, tone: 'issue' },
};

export const Resolved: Story = {
  args: { children: 'this part', index: 4, tone: 'comment', resolved: true },
};

export const Active: Story = {
  args: { children: 'focus here', index: 5, tone: 'note', active: true },
};

export const PinOnly: Story = { args: { index: 7, tone: 'comment', pinOnly: true } };

export const InProse: Story = {
  render: () => (
    <p className="max-w-prose text-sm leading-relaxed">
      The new pricing model{' '}
      <AnnotationMarker index={1} tone="comment">
        increases ARPU by 18%
      </AnnotationMarker>{' '}
      compared to the previous quarter.{' '}
      <AnnotationMarker index={2} tone="suggestion">
        Consider adding a Q3 footnote
      </AnnotationMarker>{' '}
      so the chart matches the report.{' '}
      <AnnotationMarker index={3} tone="issue" resolved>
        This number was wrong
      </AnnotationMarker>{' '}
      — fixed in the v2 sheet.
    </p>
  ),
};
