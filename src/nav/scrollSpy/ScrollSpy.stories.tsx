import type { Meta, StoryObj } from '@storybook/react';
import { ScrollSpy } from './ScrollSpy';

const meta: Meta = {
  title: 'Nav/ScrollSpy',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const SECTIONS = ['intro', 'usage', 'api', 'examples', 'faq'];

export const Default: Story = {
  render: () => (
    <div className="grid grid-cols-[160px_1fr] gap-6">
      <ScrollSpy ids={SECTIONS}>
        {({ activeId }) => (
          <nav className="sticky top-2 self-start">
            <ul className="space-y-1 text-sm">
              {SECTIONS.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={
                      activeId === id
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  >
                    {id}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              active: <code>{activeId ?? '—'}</code>
            </p>
          </nav>
        )}
      </ScrollSpy>
      <div>
        {SECTIONS.map((id) => (
          <section id={id} key={id} className="min-h-[60vh] py-6">
            <h2 className="text-xl font-semibold capitalize">{id}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Scroll the page; the side nav highlights the section currently in view.
            </p>
          </section>
        ))}
      </div>
    </div>
  ),
};
