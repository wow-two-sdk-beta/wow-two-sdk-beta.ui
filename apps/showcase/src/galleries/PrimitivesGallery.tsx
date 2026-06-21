import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibleIcon,
  AnchoredPositioner,
  Announce,
  createCollection,
  DirectionProvider,
  DismissableLayer,
  FocusScope,
  FormControlProvider,
  OverlayArrow,
  Portal,
  Presence,
  RovingFocusGroup,
  ScrollLockProvider,
  Slot,
  useDirection,
  useFormControl,
  useRovingFocusItem,
  VisuallyHidden,
} from '@wow-two-beta/ui/primitives';
import { Button } from '@wow-two-beta/ui/actions';
import { SectionHeader } from '@wow-two-beta/ui/display';
import { Label } from '@wow-two-beta/ui/forms';

/* ------------------------------------------------------------------ */
/* Page scaffolding                                                    */
/* ------------------------------------------------------------------ */

function Demo({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex min-h-12 flex-col items-start gap-2">{children}</div>
      <p className="border-t border-border pt-2 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={title} description={description} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

const inputClass =
  'rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground';

/* ------------------------------------------------------------------ */
/* Slot                                                                */
/* ------------------------------------------------------------------ */

function SlotDemo() {
  const [slotClicks, setSlotClicks] = useState(0);
  return (
    <Demo caption="Slot — merges the parent's className + onClick onto the single child element (an <a> here), enabling asChild APIs.">
      <Slot
        className="inline-block cursor-pointer rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground"
        onClick={() => setSlotClicks((c) => c + 1)}
      >
        <a href="#slot" onClick={(e) => e.preventDefault()}>
          I am an &lt;a&gt; dressed by Slot — click me
        </a>
      </Slot>
      <span className="text-xs text-muted-foreground">
        chained handler fired {slotClicks} time{slotClicks === 1 ? '' : 's'} (child's
        preventDefault ran first)
      </span>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* Portal                                                              */
/* ------------------------------------------------------------------ */

function PortalDemo() {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const [teleported, setTeleported] = useState(false);
  return (
    <Demo caption="Portal — the badge is declared inside the left box but renders into the right box via container.">
      <div className="grid w-full grid-cols-2 gap-3">
        <div className="flex flex-col items-start gap-2 rounded-md border border-border p-3">
          <span className="text-xs font-medium text-foreground">source (declared here)</span>
          <Button size="xs" variant="soft" onClick={() => setTeleported((t) => !t)}>
            {teleported ? 'Bring back' : 'Teleport badge'}
          </Button>
          {teleported && target && (
            <Portal container={target} name="primitives-gallery-demo">
              <span className="inline-block rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                I traveled via Portal
              </span>
            </Portal>
          )}
        </div>
        <div
          ref={setTarget}
          className="flex min-h-20 flex-col items-start gap-2 rounded-md border border-dashed border-border bg-muted p-3"
        >
          <span className="text-xs font-medium text-muted-foreground">portal target</span>
        </div>
      </div>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* Presence                                                            */
/* ------------------------------------------------------------------ */

function PresenceDemo() {
  const [present, setPresent] = useState(true);
  return (
    <Demo caption="Presence — child stays mounted with data-state='closed' until its exit transition ends, then unmounts.">
      <Button size="xs" variant="soft" onClick={() => setPresent((p) => !p)}>
        {present ? 'Animate out' : 'Animate in'}
      </Button>
      <div className="h-14 w-full">
        <Presence isPresent={present}>
          <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground transition-all duration-300 data-[state=closed]:translate-y-1 data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100">
            I fade + slide before unmounting
          </div>
        </Presence>
      </div>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* VisuallyHidden + AccessibleIcon                                     */
/* ------------------------------------------------------------------ */

function StarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.2 5.8 20.9l1.6-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  );
}

function VisuallyHiddenDemo() {
  const [favorited, setFavorited] = useState(false);
  return (
    <Demo caption="VisuallyHidden — the label is removed from layout but read by screen readers; the button's accessible name is 'Mark as favorite'.">
      <button
        type="button"
        onClick={() => setFavorited((f) => !f)}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-foreground"
      >
        <StarGlyph />
        <VisuallyHidden>Mark as favorite</VisuallyHidden>
      </button>
      <span className="text-xs text-muted-foreground">
        visually icon-only · state: {favorited ? 'favorited' : 'not favorited'}
      </span>
    </Demo>
  );
}

function AccessibleIconDemo() {
  return (
    <Demo caption="AccessibleIcon — wraps an icon with aria-hidden and adds a VisuallyHidden label sibling ('Open settings').">
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1.5 text-foreground"
      >
        <AccessibleIcon label="Open settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </AccessibleIcon>
      </button>
      <span className="text-xs text-muted-foreground">
        screen readers announce the label, not the SVG
      </span>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* Announce                                                            */
/* ------------------------------------------------------------------ */

function AnnounceDemo() {
  const [politeMsg, setPoliteMsg] = useState('');
  const [assertiveMsg, setAssertiveMsg] = useState('');
  const [tick, setTick] = useState(0);
  return (
    <Demo caption="Announce — visually-hidden ARIA live regions; polite → role=status, assertive → role=alert. Swapped children get announced.">
      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="soft"
          onClick={() => {
            setTick((t) => t + 1);
            setPoliteMsg(`Draft saved (#${tick + 1})`);
          }}
        >
          Announce politely
        </Button>
        <Button
          size="xs"
          variant="soft"
          tone="danger"
          onClick={() => {
            setTick((t) => t + 1);
            setAssertiveMsg(`Connection lost (#${tick + 1})`);
          }}
        >
          Announce assertively
        </Button>
      </div>
      <Announce politeness="polite">{politeMsg}</Announce>
      <Announce politeness="assertive">{assertiveMsg}</Announce>
      <span className="text-xs text-muted-foreground">
        last polite: {politeMsg || '—'} · last assertive: {assertiveMsg || '—'}
      </span>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* FocusScope                                                          */
/* ------------------------------------------------------------------ */

function FocusScopeDemo() {
  const [trapOpen, setTrapOpen] = useState(false);
  return (
    <Demo caption="FocusScope — trapped + loop: Tab cycles inside the box; focus returns to the trigger on release.">
      {!trapOpen ? (
        <Button size="xs" variant="soft" onClick={() => setTrapOpen(true)}>
          Activate focus trap
        </Button>
      ) : (
        <FocusScope
          trapped
          loop
          className="flex w-full max-w-xs flex-col gap-2 rounded-md border border-border bg-muted p-3"
        >
          <input className={inputClass} placeholder="Field A" />
          <input className={inputClass} placeholder="Field B" />
          <Button size="xs" onClick={() => setTrapOpen(false)}>
            Release trap
          </Button>
        </FocusScope>
      )}
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* RovingFocusGroup (+ DirectionProvider)                              */
/* ------------------------------------------------------------------ */

function RovingChip({ label, onPick }: { label: string; onPick: (label: string) => void }) {
  const itemProps = useRovingFocusItem();
  return (
    <button
      type="button"
      {...itemProps}
      onClick={() => onPick(label)}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
    >
      {label}
    </button>
  );
}

function RovingFocusDemo() {
  const [picked, setPicked] = useState('—');
  return (
    <Demo caption="RovingFocusGroup — one tab stop for the whole group; Arrow keys / Home / End move focus between chips.">
      <RovingFocusGroup orientation="horizontal" canLoop className="flex flex-wrap gap-2">
        {['One', 'Two', 'Three', 'Four', 'Five'].map((label) => (
          <RovingChip key={label} label={label} onPick={setPicked} />
        ))}
      </RovingFocusGroup>
      <span className="text-xs text-muted-foreground">
        click into the group, then use ← → · last activated: {picked}
      </span>
    </Demo>
  );
}

function DirectionBadge() {
  const dir = useDirection();
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      useDirection() → {dir}
    </span>
  );
}

function DirectionProviderDemo() {
  const [picked, setPicked] = useState('—');
  return (
    <Demo caption="DirectionProvider — descendants read the direction via useDirection(); the rtl RovingFocusGroup mirrors its arrow keys.">
      <div className="flex w-full flex-col gap-3">
        <DirectionProvider dir="ltr">
          <div className="flex items-center gap-2">
            <DirectionBadge />
          </div>
        </DirectionProvider>
        <DirectionProvider dir="rtl">
          <div dir="rtl" className="flex flex-col items-start gap-2">
            <DirectionBadge />
            <RovingFocusGroup orientation="horizontal" canLoop className="flex flex-wrap gap-2">
              {['Alif', 'Ba', 'Ta'].map((label) => (
                <RovingChip key={label} label={label} onPick={setPicked} />
              ))}
            </RovingFocusGroup>
          </div>
        </DirectionProvider>
        <span className="text-xs text-muted-foreground">
          in the rtl row, ArrowLeft moves forward · last activated: {picked}
        </span>
      </div>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* DismissableLayer                                                    */
/* ------------------------------------------------------------------ */

function DismissableLayerDemo() {
  const [layerOpen, setLayerOpen] = useState(false);
  const [lastDismiss, setLastDismiss] = useState('—');
  return (
    <Demo caption="DismissableLayer — stack-aware dismissal: only the topmost layer reacts to Escape / outside pointer-down.">
      {!layerOpen ? (
        <Button size="xs" variant="soft" onClick={() => setLayerOpen(true)}>
          Mount layer
        </Button>
      ) : (
        <DismissableLayer
          className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground"
          onEscape={() => {
            setLastDismiss('Escape key');
            setLayerOpen(false);
          }}
          onOutsidePointerDown={() => {
            setLastDismiss('outside pointer-down');
            setLayerOpen(false);
          }}
        >
          Press Escape or click anywhere outside me.
        </DismissableLayer>
      )}
      <span className="text-xs text-muted-foreground">last dismissal: {lastDismiss}</span>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* AnchoredPositioner                                                  */
/* ------------------------------------------------------------------ */

const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const;
type DemoPlacement = (typeof PLACEMENTS)[number];

function AnchoredPositionerDemo() {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<DemoPlacement>('bottom');
  return (
    <Demo caption="AnchoredPositioner — Floating UI surface: flips/shifts to stay in viewport and exposes --anchor-width/--anchor-height CSS vars.">
      <div className="flex flex-wrap items-center gap-2">
        {PLACEMENTS.map((p) => (
          <Button
            key={p}
            size="xs"
            variant={placement === p ? 'solid' : 'soft'}
            onClick={() => setPlacement(p)}
          >
            {p}
          </Button>
        ))}
      </div>
      <Button ref={setAnchor} size="sm" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide panel' : 'Show anchored panel'}
      </Button>
      {open && anchor && (
        <AnchoredPositioner anchor={anchor} placement={placement} offset={8} className="z-10">
          <div className="min-w-[var(--anchor-width)] rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-sm">
            anchored: {placement} · sized via <code className="text-subtle-foreground">--anchor-width</code>
          </div>
        </AnchoredPositioner>
      )}
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* OverlayArrow                                                        */
/* ------------------------------------------------------------------ */

function OverlayArrowDemo() {
  return (
    <Demo caption="OverlayArrow — SVG tip-arrow with fill=currentColor; color follows the bubble via text-* utilities. Sizes 12×6, 20×10, 28×8.">
      <div className="flex flex-wrap items-end gap-6 pb-2">
        <div className="relative inline-block">
          <div className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
            tooltip bubble
          </div>
          <OverlayArrow className="absolute left-1/2 top-full -translate-x-1/2 text-primary" />
        </div>
        <OverlayArrow width={20} height={10} className="text-muted-foreground" />
        <OverlayArrow width={28} height={8} className="text-foreground" />
      </div>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* ScrollLockProvider                                                  */
/* ------------------------------------------------------------------ */

function ScrollLockDemo() {
  const [locked, setLocked] = useState(false);
  return (
    <Demo caption="ScrollLockProvider — locks document.body scroll while enabled (counted, scrollbar-width compensated); toggle off to release.">
      <Button size="xs" variant={locked ? 'solid' : 'soft'} onClick={() => setLocked((l) => !l)}>
        {locked ? 'Unlock body scroll' : 'Lock body scroll'}
      </Button>
      <ScrollLockProvider isEnabled={locked}>
        <span className="text-xs text-muted-foreground">
          {locked ? 'body scroll is locked — try scrolling the page' : 'scroll unaffected'}
        </span>
      </ScrollLockProvider>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* Collection                                                          */
/* ------------------------------------------------------------------ */

const DemoCollection = createCollection<string>();

function CollectionItem({ name }: { name: string }) {
  const { register, unregister } = DemoCollection.useCollection();
  useEffect(() => {
    register(name);
    return () => unregister(name);
  }, [register, unregister, name]);
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
      {name}
    </span>
  );
}

function CollectionReadout() {
  const { items } = DemoCollection.useCollection();
  return (
    <span className="text-xs text-muted-foreground">
      parent registry: {items.length} item{items.length === 1 ? '' : 's'}
      {items.length > 0 ? ` — ${items.join(' · ')}` : ''}
    </span>
  );
}

const COLLECTION_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

function CollectionDemo() {
  const [visible, setVisible] = useState<string[]>(['Alpha', 'Bravo', 'Charlie']);
  const toggle = (name: string) =>
    setVisible((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  return (
    <Demo caption="createCollection — children self-register into a typed parent registry; the readout iterates them without prop drilling.">
      <DemoCollection.Provider>
        <div className="flex flex-wrap gap-2">
          {COLLECTION_NAMES.map((name) => (
            <Button
              key={name}
              size="xs"
              variant={visible.includes(name) ? 'solid' : 'soft'}
              onClick={() => toggle(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="flex min-h-7 flex-wrap gap-2">
          {COLLECTION_NAMES.filter((n) => visible.includes(n)).map((name) => (
            <CollectionItem key={name} name={name} />
          ))}
        </div>
        <CollectionReadout />
      </DemoCollection.Provider>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* FormControlContext                                                  */
/* ------------------------------------------------------------------ */

function WiredControl() {
  const ctx = useFormControl();
  if (!ctx) return null;
  return (
    <>
      <input
        id={ctx.id}
        aria-labelledby={ctx.labelId}
        aria-describedby={ctx.isInvalid ? ctx.errorId : ctx.helperId}
        aria-invalid={ctx.isInvalid || undefined}
        disabled={ctx.isDisabled}
        required={ctx.isRequired}
        readOnly={ctx.isReadOnly}
        placeholder="Wired via useFormControl()"
        className={`${inputClass} w-full disabled:opacity-60`}
      />
      {ctx.isInvalid ? (
        <span id={ctx.errorId} className="text-xs text-destructive">
          error slot — id: {ctx.errorId}
        </span>
      ) : (
        <span id={ctx.helperId} className="text-xs text-muted-foreground">
          helper slot — id: {ctx.helperId}
        </span>
      )}
    </>
  );
}

function FormControlDemo() {
  const [invalid, setInvalid] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [required, setRequired] = useState(true);
  return (
    <Demo caption="FormControlProvider — Label and the input wire htmlFor / id / aria-describedby through context; flags flow to every part.">
      <div className="flex flex-wrap gap-2">
        <Button size="xs" variant={invalid ? 'solid' : 'soft'} onClick={() => setInvalid((v) => !v)}>
          invalid
        </Button>
        <Button size="xs" variant={disabled ? 'solid' : 'soft'} onClick={() => setDisabled((v) => !v)}>
          disabled
        </Button>
        <Button size="xs" variant={required ? 'solid' : 'soft'} onClick={() => setRequired((v) => !v)}>
          required
        </Button>
      </div>
      <FormControlProvider
        id="primitives-form-control-demo"
        isInvalid={invalid}
        isDisabled={disabled}
        isRequired={required}
      >
        <div className="flex w-full max-w-xs flex-col gap-1.5">
          <Label>Display name</Label>
          <WiredControl />
        </div>
      </FormControlProvider>
    </Demo>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PrimitivesGallery() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Section
        title="Rendering & composition"
        description="Slot, Portal, Presence — where and how elements render."
      >
        <SlotDemo />
        <PortalDemo />
        <PresenceDemo />
      </Section>

      <Section
        title="Accessibility"
        description="VisuallyHidden, AccessibleIcon, Announce — screen-reader plumbing made visible."
      >
        <VisuallyHiddenDemo />
        <AccessibleIconDemo />
        <AnnounceDemo />
      </Section>

      <Section
        title="Focus & keyboard"
        description="FocusScope, RovingFocusGroup, DirectionProvider — keyboard navigation behaviors."
      >
        <FocusScopeDemo />
        <RovingFocusDemo />
        <DirectionProviderDemo />
      </Section>

      <Section
        title="Dismissal & positioning"
        description="DismissableLayer, AnchoredPositioner, OverlayArrow, ScrollLockProvider — overlay building blocks."
      >
        <DismissableLayerDemo />
        <AnchoredPositionerDemo />
        <OverlayArrowDemo />
        <ScrollLockDemo />
      </Section>

      <Section
        title="Context plumbing"
        description="createCollection, FormControlProvider — typed context registries and form-control wiring."
      >
        <CollectionDemo />
        <FormControlDemo />
      </Section>
    </div>
  );
}
