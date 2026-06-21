import type { Meta, StoryObj } from '@storybook/react';
import { Heart, ChevronDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { Icon } from '../../icons';
import { Button } from './Button';
import { Grid, Row } from '../../../.storybook/grid';

/* Button — visual matrices (variants × tones × sizes × shapes × states × density × RTL). */
const meta: Meta<typeof Button> = {
  title: 'Actions/Button/Matrix',
  component: Button,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost', 'link', 'glass', 'glass-surface'] as const;
const TONES = ['primary', 'neutral', 'danger', 'success', 'warning'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const SHAPES = ['default', 'square', 'circle'] as const;
/* Glass treatments only read correctly over imagery — demoed on a photo background, not a plain card. */
const GLASS_VARIANTS = ['glass', 'glass-surface'] as const;

/* 7 × 5 = 35 combos — the canonical visual matrix. Toggle the pseudo-states
   toolbar to render each cell in `:hover`, `:focus-visible`, `:active`. */
export const VariantsByTone: Story = {
  render: () => (
    <div className="p-8">
      <Grid
        rows={VARIANTS}
        cols={TONES}
        rowLabel="variant"
        colLabel="tone"
        render={(variant, tone) => (
          <Button variant={variant} tone={tone}>
            Action
          </Button>
        )}
      />
    </div>
  ),
};

/* Same matrix, every variant on a photographic background to stress-test legibility. */
export const VariantsByToneOnImage: Story = {
  render: () => (
    <div
      className="p-8"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1600&auto=format)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      <Grid
        rows={VARIANTS}
        cols={TONES}
        rowLabel="variant"
        colLabel="tone"
        render={(variant, tone) => (
          <Button variant={variant} tone={tone}>
            Action
          </Button>
        )}
      />
    </div>
  ),
};

/* glass vs glass-surface over a photo — the only context where the overlay treatment reads
   correctly. glass-surface adds a faint white hairline border on top of the dark blur. */
export const GlassVariantsOnImage: Story = {
  render: () => (
    <div
      className="p-8"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&auto=format)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      <Grid
        rows={GLASS_VARIANTS}
        cols={TONES}
        rowLabel="variant"
        colLabel="tone"
        render={(variant, tone) => (
          <Button variant={variant} tone={tone}>
            Action
          </Button>
        )}
      />
    </div>
  ),
};

/* Sizes with default text + with leading slot + in loading state. */
export const Sizes: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <Row
        label="size — text only"
        items={SIZES}
        render={(size) => <Button size={size}>Save</Button>}
      />
      <Row
        label="size — with leading icon"
        items={SIZES}
        render={(size) => (
          <Button size={size} leadingSlot={<Icon icon={Plus} size={14} />}>
            Add item
          </Button>
        )}
      />
      <Row
        label="size — isLoading (built-in spinner replaces leading)"
        items={SIZES}
        render={(size) => (
          <Button size={size} isLoading loadingText="Saving…">
            Save
          </Button>
        )}
      />
      <Row
        label="size — leadingSlot = lucide Loader2 (consumer-supplied spinner)"
        items={SIZES}
        render={(size) => (
          <Button size={size} leadingSlot={<Icon icon={Loader2} size={14} className="animate-spin" />}>
            Loading
          </Button>
        )}
      />
    </div>
  ),
};

/* Shapes — default rectangle, square (icon-only square), circle (FAB-style).
   Three distinct rows so each shape's size sweep is readable on its own. */
export const Shapes: Story = {
  render: () => (
    <div className="p-8 flex flex-col gap-10 items-start">
      <div>
        <Row
          label="shape = default — text label"
          items={SHAPES}
          render={(shape) => (
            <Button shape={shape} aria-label={shape === 'default' ? undefined : 'Add'}>
              {shape === 'default' ? 'Default' : <Icon icon={Plus} size={16} />}
            </Button>
          )}
        />
      </div>
      <div>
        <Row
          label="shape = square — icon-only, sizes xs → xl"
          items={SIZES}
          render={(size) => (
            <Button size={size} shape="square" aria-label="Add">
              <Icon icon={Plus} size={14} />
            </Button>
          )}
        />
      </div>
      <div>
        <Row
          label="shape = circle — icon-only, sizes xs → xl"
          items={SIZES}
          render={(size) => (
            <Button size={size} shape="circle" aria-label="Add">
              <Icon icon={Plus} size={14} />
            </Button>
          )}
        />
      </div>
    </div>
  ),
};

/* Each visible state, paired with `solid` and `outline` for contrast.
   Toggle the pseudo-states toolbar to see hover / focus / active variants. */
export const States: Story = {
  render: () => (
    <div className="p-8">
      <Grid
        rows={['solid', 'soft', 'outline', 'ghost'] as const}
        cols={['default', 'disabled', 'loading', 'skeleton'] as const}
        rowLabel="variant"
        colLabel="state"
        render={(variant, state) => (
          <Button
            variant={variant}
            isDisabled={state === 'disabled'}
            isLoading={state === 'loading'}
            isSkeleton={state === 'skeleton'}
            loadingText={state === 'loading' ? 'Saving…' : undefined}
          >
            Save
          </Button>
        )}
      />
    </div>
  ),
};

/* Slot composition — leading / trailing / both / loadingSlot replaces leading when isLoading. */
export const WithIcons: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-3 items-center">
      <Button leadingSlot={<Icon icon={Plus} size={16} />}>Leading icon</Button>
      <Button trailingSlot={<Icon icon={ChevronDown} size={16} />}>Trailing caret</Button>
      <Button
        leadingSlot={<Icon icon={Heart} size={16} />}
        trailingSlot={<Icon icon={ChevronDown} size={16} />}
      >
        Both
      </Button>
      <Button shape="square" aria-label="Delete" tone="danger">
        <Icon icon={Trash2} size={16} />
      </Button>
      <Button isLoading loadingText="Saving…">Save</Button>
    </div>
  ),
};

/* Long labels — truncate vs wrap, in a constrained container. */
export const LongLabels: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">isMultiline=false (default) — truncate</div>
        <div className="w-48 border border-dashed border-border-strong p-2 rounded">
          <Button>This is a really really long label that overflows the parent</Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">isMultiline=true — multi-line</div>
        <div className="w-48 border border-dashed border-border-strong p-2 rounded">
          <Button isMultiline isFullWidth>
            This is a really really long label that overflows the parent
          </Button>
        </div>
      </div>
    </div>
  ),
};

/* RTL — same matrix in `dir="rtl"`. Logical CSS props flip slot order. */
export const RTL: Story = {
  render: () => (
    <div className="p-8" dir="rtl">
      <Row
        label="dir=rtl — leading goes right, trailing goes left"
        items={['xs', 'sm', 'md', 'lg', 'xl'] as const}
        render={(size) => (
          <Button
            size={size}
            leadingSlot={<Icon icon={Plus} size={14} />}
            trailingSlot={<Icon icon={ChevronDown} size={14} />}
          >
            עברית
          </Button>
        )}
      />
    </div>
  ),
};

/* Density preview — same buttons, different `--ui-density-scale` per row. */
export const Density: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      {[
        { label: 'compact (0.85)', scale: '0.85' },
        { label: 'default (1.0)', scale: '1' },
        { label: 'spacious (1.15)', scale: '1.15' },
      ].map(({ label, scale }) => (
        <div key={label} style={{ ['--ui-density-scale' as string]: scale }}>
          <div className="text-xs text-muted-foreground mb-2">{label}</div>
          <Row
            items={SIZES}
            render={(size) => <Button size={size}>Save</Button>}
          />
        </div>
      ))}
    </div>
  ),
};

/* ANTI-PATTERN — icon-only button with NO aria-label. Triggers the dev-mode console.warn
   (Button.standard.md rule 12). Shown deliberately so the failure mode is visible in the catalog;
   never ship a button shaped like this. The labeled twin on the right is the correct fix. */
export const IconOnlyMissingLabel: Story = {
  name: 'A11y/Icon-only without aria-label (anti-pattern)',
  render: () => (
    <div className="p-8 space-y-4">
      <div className="text-xs text-destructive">
        ✗ No aria-label — open the browser console to see the dev warning.
      </div>
      <div className="flex items-center gap-3">
        <Button shape="square" tone="danger">
          <Icon icon={Trash2} size={16} />
        </Button>
      </div>
      <div className="text-xs text-success">✓ Correct — aria-label supplied.</div>
      <div className="flex items-center gap-3">
        <Button shape="square" tone="danger" aria-label="Delete">
          <Icon icon={Trash2} size={16} />
        </Button>
      </div>
    </div>
  ),
};

/* isLoading WITHOUT loadingText — the aria-hidden spinner replaces the visible label, but the
   original children stay in an sr-only span so the accessible name survives. Inspect each button's
   computed name in the a11y panel: it still reads "Save" / "Delete" etc. */
export const LoadingWithoutLoadingText: Story = {
  name: 'A11y/isLoading without loadingText (name preserved)',
  render: () => (
    <div className="p-8 flex flex-wrap gap-3 items-center">
      <Button isLoading>Save</Button>
      <Button isLoading tone="danger">Delete</Button>
      <Button isLoading variant="outline">Refresh</Button>
      <Button isLoading shape="square" aria-label="Saving">
        <Icon icon={Plus} size={16} />
      </Button>
    </div>
  ),
};

/* forced-colors / Windows High Contrast (Button.standard.md rule 15) — every variant carries a
   border (1px transparent for borderless variants) via the `forced-colors:border-[ButtonBorder]`
   class on the base, so the OS-supplied border renders and the button stays visible when the theme
   palette is replaced by system colors.

   To view: Chrome/Edge DevTools → Rendering panel → "Emulate CSS media feature forced-colors:
   active", or run Windows in High Contrast mode. Outside emulation the swatches render normally —
   the point is that NO variant collapses to an invisible box once user colors take over. */
export const ForcedColors: Story = {
  name: 'A11y/Forced-colors (high contrast)',
  render: () => (
    <div className="p-8 space-y-4">
      <div className="text-xs text-muted-foreground">
        Enable DevTools → Rendering → “Emulate CSS media feature forced-colors: active” to verify
        every variant keeps a visible border (Button.standard.md rule 15).
      </div>
      <Grid
        rows={VARIANTS}
        cols={TONES}
        rowLabel="variant"
        colLabel="tone"
        render={(variant, tone) => (
          <Button variant={variant} tone={tone}>
            Action
          </Button>
        )}
      />
    </div>
  ),
};

/* disabled × every variant — the States matrix only covers solid/soft/outline/ghost; this widens
   it to surface, link, glass, and glass-surface (the glass pair on a photo so the dimmed overlay reads). */
export const DisabledAllVariants: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <Row
        label="disabled — opaque-background variants"
        items={['solid', 'soft', 'surface', 'outline', 'ghost', 'link'] as const}
        render={(variant) => (
          <Button variant={variant} isDisabled>
            Save
          </Button>
        )}
      />
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&auto=format)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Row
          label="disabled — glass variants (over a photo)"
          items={GLASS_VARIANTS}
          render={(variant) => (
            <Button variant={variant} isDisabled>
              Save
            </Button>
          )}
        />
      </div>
    </div>
  ),
};
