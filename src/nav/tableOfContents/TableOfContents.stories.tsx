import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { TableOfContents } from './TableOfContents';

const meta: Meta = {
  title: 'Nav/TableOfContents',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const HEADINGS = ['intro', 'getting-started', 'api', 'recipes', 'troubleshooting'];

export const Explicit: Story = {
  render: () => (
    <div className="grid grid-cols-[180px_1fr] gap-6">
      <TableOfContents
        sticky
        items={HEADINGS.map((id, i) => ({ id, label: id.replace(/-/g, ' '), depth: i % 2 === 0 ? 0 : 1 }))}
      />
      <div>
        {HEADINGS.map((id) => (
          <section id={id} key={id} className="min-h-[40vh] py-6">
            <h2 className="text-xl font-semibold capitalize">{id.replace(/-/g, ' ')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Scroll the page to see the active heading update.
            </p>
          </section>
        ))}
      </div>
    </div>
  ),
};

export const AutoExtract: Story = {
  render: () => {
    function Demo() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div className="grid grid-cols-[180px_1fr] gap-6">
          <TableOfContents sticky source={ref} headingSelector="h2" />
          <div ref={ref}>
            {HEADINGS.map((id) => (
              <section id={id} key={id} className="min-h-[40vh] py-6">
                <h2 className="text-xl font-semibold capitalize">{id.replace(/-/g, ' ')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">Auto-extracted from h2 elements.</p>
              </section>
            ))}
          </div>
        </div>
      );
    }
    return <Demo />;
  },
};
