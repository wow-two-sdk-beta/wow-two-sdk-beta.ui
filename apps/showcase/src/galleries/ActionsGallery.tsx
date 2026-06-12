import { useState, type ReactNode } from 'react';
import {
  BackToTopButton,
  Button,
  ButtonGroup,
  CopyButton,
  DisclosureButton,
  FAB,
  Link,
  SegmentedControl,
  SpeedDial,
  SpeedDialAction,
  SpeedDialTrigger,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
} from '@wow-two-beta/ui/actions';
import { SectionHeader } from '@wow-two-beta/ui/display';

/* Tiny inline glyphs — keeps the gallery dependency-free. */
function PlusGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function ArrowRightGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function StarGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 2l1.8 3.8 4.2.6-3 2.9.7 4.1L8 11.4l-3.7 2 .7-4.1-3-2.9 4.2-.6L8 2z" />
    </svg>
  );
}

function PenGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M11.5 2.5l2 2L5 13l-2.7.7L3 11l8.5-8.5z" />
    </svg>
  );
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={title} description={description} level={2} size="lg" />
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function ButtonSection() {
  const [clicks, setClicks] = useState(0);
  const [longPresses, setLongPresses] = useState(0);

  return (
    <Section title="Button" description="Variants, tones, sizes, states, slots, press interactions.">
      <Demo label="Button — variants (tone primary)">
        <Button variant="solid">Solid</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="surface">Surface</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </Demo>
      <Demo label="Button — tones (variant solid)">
        <Button tone="primary">Primary</Button>
        <Button tone="neutral">Neutral</Button>
        <Button tone="danger">Danger</Button>
        <Button tone="success">Success</Button>
        <Button tone="warning">Warning</Button>
      </Demo>
      <Demo label="Button — sizes">
        <Button size="xs">XS</Button>
        <Button size="sm">SM</Button>
        <Button size="md">MD</Button>
        <Button size="lg">LG</Button>
        <Button size="xl">XL</Button>
      </Demo>
      <Demo label="Button — shapes + slots">
        <Button shape="square" aria-label="Add item">
          <PlusGlyph />
        </Button>
        <Button shape="circle" variant="soft" aria-label="Favorite">
          <StarGlyph />
        </Button>
        <Button leadingSlot={<PlusGlyph />}>New project</Button>
        <Button variant="outline" tone="neutral" trailingSlot={<ArrowRightGlyph />}>
          Continue
        </Button>
      </Demo>
      <Demo label="Button — states">
        <Button isLoading loadingText="Saving…">
          Save
        </Button>
        <Button isSkeleton>Skeleton width</Button>
        <Button isDisabled>Disabled</Button>
        <Button variant="soft" isFullWidth>
          Full width
        </Button>
      </Demo>
      <Demo label="Button — press interactions (debounce 600ms · long-press 500ms)">
        <Button variant="surface" debounceMs={600} onClick={() => setClicks((c) => c + 1)}>
          Click me
        </Button>
        <Button
          variant="outline"
          tone="neutral"
          onLongPress={() => setLongPresses((c) => c + 1)}
        >
          Hold me
        </Button>
        <span className="text-sm text-muted-foreground">
          clicks: {clicks} · long-presses: {longPresses}
        </span>
        <Button asChild variant="ghost" tone="neutral">
          <a href="#as-child" onClick={(e) => e.preventDefault()}>
            asChild anchor
          </a>
        </Button>
      </Demo>
    </Section>
  );
}

function LinkAndGroupSection() {
  return (
    <Section title="Link & ButtonGroup" description="Styled anchors and grouped actions.">
      <Demo label="Link — variants">
        <Link href="#link-default" onClick={(e) => e.preventDefault()}>
          Default
        </Link>
        <Link href="#link-subtle" variant="subtle" onClick={(e) => e.preventDefault()}>
          Subtle
        </Link>
        <Link href="#link-muted" variant="muted" onClick={(e) => e.preventDefault()}>
          Muted
        </Link>
        <span className="text-warning">
          <Link href="#link-inherit" variant="inherit" onClick={(e) => e.preventDefault()}>
            Inherit
          </Link>
        </span>
      </Demo>
      <Demo label="Link — sizes">
        <Link href="#link-sm" size="sm" onClick={(e) => e.preventDefault()}>
          Small
        </Link>
        <Link href="#link-md" size="md" onClick={(e) => e.preventDefault()}>
          Medium
        </Link>
        <Link href="#link-lg" size="lg" onClick={(e) => e.preventDefault()}>
          Large
        </Link>
      </Demo>
      <Demo label="ButtonGroup — attached (horizontal)">
        <ButtonGroup>
          <Button variant="outline" tone="neutral">
            Years
          </Button>
          <Button variant="outline" tone="neutral">
            Months
          </Button>
          <Button variant="outline" tone="neutral">
            Days
          </Button>
        </ButtonGroup>
      </Demo>
      <Demo label="ButtonGroup — detached + vertical">
        <ButtonGroup attached={false}>
          <Button variant="soft">Save</Button>
          <Button variant="soft" tone="neutral">
            Cancel
          </Button>
        </ButtonGroup>
        <ButtonGroup orientation="vertical">
          <Button variant="outline" tone="neutral">
            Top
          </Button>
          <Button variant="outline" tone="neutral">
            Middle
          </Button>
          <Button variant="outline" tone="neutral">
            Bottom
          </Button>
        </ButtonGroup>
      </Demo>
    </Section>
  );
}

function ToggleSection() {
  const [muted, setMuted] = useState(false);
  const [align, setAlign] = useState<string | null>('left');
  const [view, setView] = useState<string | null>('list');

  return (
    <Section
      title="Toggles & Segments"
      description="ToggleButton, ToggleButtonGroup (single/multi), SegmentedControl."
    >
      <Demo label="ToggleButton — controlled + render-prop label">
        <ToggleButton
          pressed={muted}
          onPressedChange={setMuted}
          aria-label={({ pressed }) => (pressed ? 'Unmute' : 'Mute')}
          title={({ pressed }) => (pressed ? 'Unmute' : 'Mute')}
        >
          {({ pressed }) => (pressed ? 'Muted' : 'Unmuted')}
        </ToggleButton>
        <ToggleButton defaultPressed variant="outline" tone="success">
          {({ pressed }) => (pressed ? 'Following' : 'Follow')}
        </ToggleButton>
        <ToggleButton variant="soft" tone="warning" defaultPressed={false}>
          <StarGlyph />
          <span>Star</span>
        </ToggleButton>
        <span className="text-sm text-muted-foreground">muted: {String(muted)}</span>
      </Demo>
      <Demo label="ToggleButtonGroup — single (controlled)">
        <ToggleButtonGroup value={align} onValueChange={setAlign} aria-label="Text alignment">
          <ToggleButton value="left">Left</ToggleButton>
          <ToggleButton value="center">Center</ToggleButton>
          <ToggleButton value="right">Right</ToggleButton>
        </ToggleButtonGroup>
        <span className="text-sm text-muted-foreground">align: {align ?? 'none'}</span>
      </Demo>
      <Demo label="ToggleButtonGroup — multi (uncontrolled, detached)">
        <ToggleButtonGroup type="multi" defaultValue={['bold']} attached={false} aria-label="Text style">
          <ToggleButton value="bold" variant="outline">
            Bold
          </ToggleButton>
          <ToggleButton value="italic" variant="outline">
            Italic
          </ToggleButton>
          <ToggleButton value="underline" variant="outline">
            Underline
          </ToggleButton>
        </ToggleButtonGroup>
      </Demo>
      <Demo label="SegmentedControl — controlled">
        <SegmentedControl value={view} onValueChange={setView} aria-label="View mode">
          <ToggleButton value="list">List</ToggleButton>
          <ToggleButton value="board">Board</ToggleButton>
          <ToggleButton value="timeline">Timeline</ToggleButton>
        </SegmentedControl>
        <span className="text-sm text-muted-foreground">view: {view ?? 'none'}</span>
      </Demo>
    </Section>
  );
}

function UtilityButtonsSection() {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <Section
      title="Copy & Disclosure"
      description="Clipboard copy with copied-state swap; expand/collapse buttons."
    >
      <Demo label="CopyButton — icon-only + render-prop">
        <CopyButton
          text="pnpm add @wow-two-beta/ui"
          aria-label="Copy install command"
          copiedAriaLabel="Copied"
        />
        <CopyButton
          text="https://github.com/wow-two-sdk-beta"
          variant="outline"
          tone="neutral"
          aria-label="Copy repository URL"
        >
          {({ copied }) => (copied ? 'Copied!' : 'Copy link')}
        </CopyButton>
        <code className="rounded bg-muted px-2 py-1 text-xs text-foreground">
          pnpm add @wow-two-beta/ui
        </code>
      </Demo>
      <Demo label="DisclosureButton — controlled with panel">
        <div className="w-full">
          <DisclosureButton open={faqOpen} onOpenChange={setFaqOpen}>
            What does beta-forever mean?
          </DisclosureButton>
          {faqOpen && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              The package stays at 0.x — CI bumps the patch on every push, breaking changes go in
              normally, and consumers pin exact versions.
            </p>
          )}
          <DisclosureButton defaultOpen chevronSide="left">
            Chevron on the left (uncontrolled)
          </DisclosureButton>
        </div>
      </Demo>
    </Section>
  );
}

function ToolbarSection() {
  const [lastAction, setLastAction] = useState('none');

  return (
    <Section
      title="Toolbar"
      description="Roving-focus group — Arrow keys move between items."
    >
      <Demo label="Toolbar — buttons, separator, link">
        <Toolbar aria-label="Text formatting">
          <ToolbarButton onClick={() => setLastAction('bold')}>Bold</ToolbarButton>
          <ToolbarButton onClick={() => setLastAction('italic')}>Italic</ToolbarButton>
          <ToolbarButton onClick={() => setLastAction('underline')}>Underline</ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton aria-label="Edit" onClick={() => setLastAction('edit')}>
            <PenGlyph />
          </ToolbarButton>
          <ToolbarLink href="#toolbar-docs" onClick={(e) => e.preventDefault()}>
            Docs
          </ToolbarLink>
        </Toolbar>
        <span className="text-sm text-muted-foreground">last action: {lastAction}</span>
      </Demo>
      <Demo label="Toolbar — vertical orientation">
        <Toolbar orientation="vertical" aria-label="Vertical tools">
          <ToolbarButton onClick={() => setLastAction('cut')}>Cut</ToolbarButton>
          <ToolbarButton onClick={() => setLastAction('copy')}>Copy</ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={() => setLastAction('paste')}>Paste</ToolbarButton>
        </Toolbar>
      </Demo>
    </Section>
  );
}

function FloatingSection() {
  const [lastDialAction, setLastDialAction] = useState('none');
  const [scrollBox, setScrollBox] = useState<HTMLDivElement | null>(null);

  return (
    <Section
      title="Floating actions"
      description="FAB, SpeedDial, and BackToTopButton — pinned-position components shown inline (position overridden for the gallery)."
    >
      <Demo label="FAB — variants + sizes (inline via static override)">
        <FAB aria-label="Create" className="static">
          <PlusGlyph />
        </FAB>
        <FAB aria-label="Edit" variant="secondary" size="sm" className="static">
          <PenGlyph />
        </FAB>
        <FAB aria-label="Delete" variant="destructive" size="lg" className="static">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 4h10M6 4V3h4v1M5 4l.7 9h4.6L11 4" />
          </svg>
        </FAB>
      </Demo>
      <Demo label="SpeedDial — click the trigger to expand (Esc closes)">
        <div className="relative flex h-24 w-full items-center">
          <SpeedDial
            direction="right"
            className="relative !bottom-auto !left-auto !right-auto !top-auto"
          >
            <SpeedDialTrigger aria-label="Toggle quick actions" size="sm" />
            <SpeedDialAction
              aria-label="New note"
              icon={<PenGlyph />}
              tooltip="New note"
              onSelect={() => setLastDialAction('new note')}
            />
            <SpeedDialAction
              aria-label="Add favorite"
              icon={<StarGlyph />}
              tooltip="Favorite"
              onSelect={() => setLastDialAction('favorite')}
            />
            <SpeedDialAction
              aria-label="Add item"
              icon={<PlusGlyph />}
              tooltip="Add item"
              onSelect={() => setLastDialAction('add item')}
            />
          </SpeedDial>
          <span className="ml-4 text-sm text-muted-foreground">selected: {lastDialAction}</span>
        </div>
      </Demo>
      <Demo label="BackToTopButton — scroll the box ~80px and the button appears">
        <div className="relative w-full">
          <div
            ref={setScrollBox}
            className="h-48 w-full overflow-y-auto rounded-md border border-border bg-muted p-4"
          >
            {['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliett', 'kilo', 'lima'].map(
              (word) => (
                <p key={word} className="py-3 text-sm text-muted-foreground">
                  Scrollable filler row — {word}. Keep scrolling to reveal the floating button.
                </p>
              ),
            )}
          </div>
          <BackToTopButton
            threshold={80}
            scrollContainer={scrollBox}
            position="bottom-right"
            label="Top"
            aria-label="Back to top of the box"
            className="absolute"
          />
        </div>
      </Demo>
    </Section>
  );
}

/* Gallery for the actions domain — every '@wow-two-beta/ui/actions' component rendered live. */
export default function ActionsGallery() {
  return (
    <div className="flex flex-col gap-10">
      <ButtonSection />
      <LinkAndGroupSection />
      <ToggleSection />
      <UtilityButtonsSection />
      <ToolbarSection />
      <FloatingSection />
    </div>
  );
}
