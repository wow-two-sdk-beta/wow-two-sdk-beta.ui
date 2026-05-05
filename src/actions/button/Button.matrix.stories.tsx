import type { Meta, StoryObj } from '@storybook/react';
import { Heart, ChevronDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { Icon } from '../../icons';
import { Button } from './Button';
import { Grid, Row } from '../../../.storybook/grid';

/**
 * Button — Matrix.
 *
 * Programmatic grids covering every concrete axis of the spec at a glance.
 * Pair with the storybook-addon-pseudo-states toolbar to multiply by
 * interaction states (hover / focus-visible / active) without manual hover.
 */
const meta: Meta<typeof Button> = {
  title: 'Actions/Button/Matrix',
  component: Button,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost', 'link', 'glass'] as const;
const TONES = ['primary', 'neutral', 'danger', 'success', 'warning'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const SHAPES = ['default', 'square', 'circle'] as const;

/** 6 × 5 = 30 combos — the canonical visual matrix. Toggle the pseudo-states
 *  toolbar to render each cell in `:hover`, `:focus-visible`, `:active`. */
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

/** Same matrix, glass on a photographic background to stress-test legibility. */
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

/** Sizes with default text + with leading icon + in loading state. */
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
          <Button size={size} leading={<Icon icon={Plus} size={14} />}>
            Add item
          </Button>
        )}
      />
      <Row
        label="size — loading (built-in spinner replaces leading)"
        items={SIZES}
        render={(size) => (
          <Button size={size} loading loadingText="Saving…">
            Save
          </Button>
        )}
      />
      <Row
        label="size — leading icon = lucide Loader2 (consumer-supplied spinner)"
        items={SIZES}
        render={(size) => (
          <Button size={size} leading={<Icon icon={Loader2} size={14} className="animate-spin" />}>
            Loading
          </Button>
        )}
      />
    </div>
  ),
};

/** Shapes — default rectangle, square (icon-only square), circle (FAB-style).
 *  Three distinct rows so each shape's size sweep is readable on its own. */
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

/** Each visible state, paired with `solid` and `outline` for contrast.
 *  Toggle the pseudo-states toolbar to see hover / focus / active variants. */
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
            disabled={state === 'disabled'}
            loading={state === 'loading'}
            skeleton={state === 'skeleton'}
            loadingText={state === 'loading' ? 'Saving…' : undefined}
          >
            Save
          </Button>
        )}
      />
    </div>
  ),
};

/** Slot composition — leading / trailing / both / loading replaces leading. */
export const WithIcons: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-3 items-center">
      <Button leading={<Icon icon={Plus} size={16} />}>Leading icon</Button>
      <Button trailing={<Icon icon={ChevronDown} size={16} />}>Trailing caret</Button>
      <Button
        leading={<Icon icon={Heart} size={16} />}
        trailing={<Icon icon={ChevronDown} size={16} />}
      >
        Both
      </Button>
      <Button shape="square" aria-label="Delete" tone="danger">
        <Icon icon={Trash2} size={16} />
      </Button>
      <Button loading loadingText="Saving…">Save</Button>
    </div>
  ),
};

/** Long labels — truncate vs wrap, in a constrained container. */
export const LongLabels: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">wrap=false (default) — truncate</div>
        <div className="w-48 border border-dashed border-border-strong p-2 rounded">
          <Button>This is a really really long label that overflows the parent</Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">wrap=true — multi-line</div>
        <div className="w-48 border border-dashed border-border-strong p-2 rounded">
          <Button wrap fullWidth>
            This is a really really long label that overflows the parent
          </Button>
        </div>
      </div>
    </div>
  ),
};

/** RTL — same matrix in `dir="rtl"`. Logical CSS props flip slot order. */
export const RTL: Story = {
  render: () => (
    <div className="p-8" dir="rtl">
      <Row
        label="dir=rtl — leading goes right, trailing goes left"
        items={['xs', 'sm', 'md', 'lg', 'xl'] as const}
        render={(size) => (
          <Button
            size={size}
            leading={<Icon icon={Plus} size={14} />}
            trailing={<Icon icon={ChevronDown} size={14} />}
          >
            עברית
          </Button>
        )}
      />
    </div>
  ),
};

/** Density preview — same buttons, different `--ui-density-scale` per row. */
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
