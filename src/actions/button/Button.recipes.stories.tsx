import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Heart, Plus, Trash2, Pencil, ArrowRight, Save } from 'lucide-react';
import { Icon } from '../../icons';
import { Button } from './Button';

/**
 * Button — Recipes.
 *
 * Curated real-world combinations. Each recipe is a "blessed pattern" — the
 * shape of Button consumers should reach for first when the use case matches.
 */
const meta: Meta<typeof Button> = {
  title: 'Actions/Button/Recipes',
  component: Button,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj;

/** Primary call-to-action at hero scale — leading icon, large size. */
export const PrimaryCTA: Story = {
  render: () => (
    <Button size="lg" leading={<Icon icon={ArrowRight} size={18} />}>
      Get started
    </Button>
  ),
};

/** Destructive action — danger tone, leading icon, intentional weight. */
export const DangerWithIcon: Story = {
  render: () => (
    <Button tone="danger" leading={<Icon icon={Trash2} size={16} />}>
      Delete account
    </Button>
  ),
};

/** Toolbar of icon-only ghost buttons — square shape, sm size, aria-label each. */
export const IconOnlyToolbar: Story = {
  render: () => (
    <div className="flex gap-1 p-1 rounded border border-border bg-card">
      <Button variant="ghost" size="sm" shape="square" aria-label="Add">
        <Icon icon={Plus} size={16} />
      </Button>
      <Button variant="ghost" size="sm" shape="square" aria-label="Edit">
        <Icon icon={Pencil} size={16} />
      </Button>
      <Button variant="ghost" size="sm" shape="square" aria-label="Save">
        <Icon icon={Save} size={16} />
      </Button>
      <Button variant="ghost" size="sm" shape="square" tone="danger" aria-label="Delete">
        <Icon icon={Trash2} size={16} />
      </Button>
    </div>
  ),
};

/** Action-loading — click, spinner replaces leading, aria-busy, blocked. */
export const Loading: Story = {
  render: function LoadingStory() {
    const [busy, setBusy] = useState(false);
    return (
      <Button
        loading={busy}
        loadingText="Saving…"
        leading={<Icon icon={Save} size={16} />}
        onClick={() => {
          setBusy(true);
          window.setTimeout(() => setBusy(false), 1500);
        }}
      >
        Save changes
      </Button>
    );
  },
};

/** Content-loading (skeleton) — label depends on backend. Toggles every 1.5s. */
export const Skeleton: Story = {
  render: function SkeletonStory() {
    const [loaded, setLoaded] = useState(false);
    return (
      <div className="flex flex-col items-center gap-3">
        <Button skeleton={!loaded}>Edit profile · Sultonbek</Button>
        <Button variant="soft" tone="neutral" size="sm" onClick={() => setLoaded((l) => !l)}>
          Toggle data state
        </Button>
      </div>
    );
  },
};

/** Glass overlay — `variant="glass" shape="circle"` over an image. The
 *  consumer adds positioning + reveal-on-hover via className (or uses the
 *  `OverlayButton` wrapper which bakes these in). */
export const GlassOverlay: Story = {
  render: () => (
    <div
      className="relative w-80 h-56 rounded-lg overflow-hidden group"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&auto=format)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Button
        variant="glass"
        shape="circle"
        size="sm"
        aria-label="Favorite"
        className="absolute top-2 right-2"
      >
        <Icon icon={Heart} size={16} />
      </Button>
      <Button
        variant="glass"
        shape="circle"
        size="sm"
        aria-label="Edit"
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Icon icon={Pencil} size={16} />
      </Button>
    </div>
  ),
};

/** asChild — render as `<a>` for semantically-correct navigation. */
export const AsChildLink: Story = {
  render: () => (
    <Button asChild variant="outline">
      <a href="https://wow-two-sdk-beta.github.io/wow-two-sdk-beta.ui/" target="_blank" rel="noreferrer">
        Storybook
      </a>
    </Button>
  ),
};

/** fullWidth in a form footer — submit + cancel pair. */
export const FullWidthForm: Story = {
  render: () => (
    <form className="w-72 space-y-3 p-4 border border-border rounded-lg" onSubmit={(e) => e.preventDefault()}>
      <input
        className="w-full px-3 py-2 rounded border border-input bg-background text-foreground"
        placeholder="Email"
        type="email"
      />
      <input
        className="w-full px-3 py-2 rounded border border-input bg-background text-foreground"
        placeholder="Password"
        type="password"
      />
      <Button type="submit" fullWidth>Sign in</Button>
      <Button variant="ghost" tone="neutral" fullWidth>Cancel</Button>
    </form>
  ),
};

/** Link variant — inline with text. */
export const LinkInline: Story = {
  render: () => (
    <p className="text-sm text-foreground max-w-md">
      By continuing you agree to our{' '}
      <Button variant="link" tone="primary">Terms of Service</Button>
      {' '}and{' '}
      <Button variant="link" tone="primary">Privacy Policy</Button>.
    </p>
  ),
};

/** `minWidth` — reserves enough space so the button doesn't reflow when its
 *  label morphs through a state sequence ("Save" → "Saving…" → "Saved"). */
export const FixedWidthOnLabelChange: Story = {
  render: function FixedWidthStory() {
    const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const label = state === 'idle' ? 'Save' : state === 'saving' ? 'Saving…' : 'Saved ✓';
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-6 items-center">
          <div className="flex flex-col items-center gap-1">
            <Button onClick={() => {
              setState('saving');
              setTimeout(() => setState('saved'), 1200);
              setTimeout(() => setState('idle'), 2400);
            }}>{label}</Button>
            <span className="text-[10px] text-muted-foreground">no minWidth (jiggles)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button minWidth={100} onClick={() => {
              setState('saving');
              setTimeout(() => setState('saved'), 1200);
              setTimeout(() => setState('idle'), 2400);
            }}>{label}</Button>
            <span className="text-[10px] text-muted-foreground">minWidth=100 (stable)</span>
          </div>
        </div>
      </div>
    );
  },
};
