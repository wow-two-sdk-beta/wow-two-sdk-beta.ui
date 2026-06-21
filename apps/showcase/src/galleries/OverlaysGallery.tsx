import { useState, type ReactNode } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import { SectionHeader } from '@wow-two-beta/ui/display';
import {
  ActionSheet,
  ActionSheetAction,
  ActionSheetCancel,
  AlertDialog,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  Backdrop,
  BottomSheet,
  BottomSheetTitle,
  BottomSheetDescription,
  useBottomSheet,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardArrow,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
} from '@wow-two-beta/ui/overlays';

/* ---------------------------------- chrome --------------------------------- */

const TRIGGER_CLS =
  'inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/* Footer-friendly DialogClose/DrawerClose — neutralizes the default absolute X chrome. */
const FOOTER_CLOSE_CLS =
  'static inline-flex h-9 w-auto items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted';

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
      <div className="flex flex-wrap gap-4">{children}</div>
    </section>
  );
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-60 flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ---------------------------------- dialog --------------------------------- */

function RenameProjectDialog() {
  const [name, setName] = useState('Q3 Launch Plan');
  const [draft, setDraft] = useState('Q3 Launch Plan');
  return (
    <>
      <Dialog onOpenChange={(open) => open && setDraft(name)}>
        <DialogTrigger className={TRIGGER_CLS}>Rename project</DialogTrigger>
        <DialogContent>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>Saved on confirm — Cancel discards the draft.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Project name</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <DialogClose className={FOOTER_CLOSE_CLS}>Cancel</DialogClose>
            <DialogClose
              onClick={() => setName(draft)}
              className="static inline-flex h-9 w-auto items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <span className="text-sm text-muted-foreground">
        Current: <span className="text-foreground">{name}</span>
      </span>
    </>
  );
}

function BlurredDialog() {
  return (
    <Dialog>
      <DialogTrigger className={TRIGGER_CLS}>Open with blur</DialogTrigger>
      <DialogContent isBlurred>
        <DialogClose />
        <DialogHeader>
          <DialogTitle>Blurred backdrop</DialogTitle>
          <DialogDescription>The scrim behind this modal applies a backdrop blur.</DialogDescription>
        </DialogHeader>
        <DialogBody>Escape or outside click dismisses.</DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- alert dialog ------------------------------ */

function ArchiveAlertDialog() {
  const [archived, setArchived] = useState(false);
  return (
    <>
      <AlertDialog>
        <DialogTrigger className={TRIGGER_CLS} disabled={archived}>
          Archive workspace
        </DialogTrigger>
        <AlertDialogContent>
          <DialogHeader>
            <DialogTitle>Archive this workspace?</DialogTitle>
            <DialogDescription>
              Members lose access until it is restored. Outside click is disabled — choose an
              action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onAction={() => setArchived(true)}>Archive</AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {archived && (
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          Workspace archived.
          <Button size="xs" variant="outline" onClick={() => setArchived(false)}>
            Restore
          </Button>
        </span>
      )}
    </>
  );
}

/* ---------------------------------- drawer --------------------------------- */

const NAV_ITEMS = ['Overview', 'Projects', 'Members', 'Billing'] as const;

function RightDrawer() {
  return (
    <Drawer>
      <DrawerTrigger className={TRIGGER_CLS}>Open right</DrawerTrigger>
      <DrawerContent>
        <DrawerClose />
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>Slides in from the right edge.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>Body content scrolls when it overflows.</DrawerBody>
        <DrawerFooter>
          <DrawerClose className={FOOTER_CLOSE_CLS}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function LeftDrawer() {
  return (
    <Drawer side="left">
      <DrawerTrigger className={TRIGGER_CLS}>Open left (sm)</DrawerTrigger>
      <DrawerContent size="sm">
        <DrawerClose />
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item} className="rounded-md px-2 py-1.5 hover:bg-muted">
                {item}
              </li>
            ))}
          </ul>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function BottomDrawer() {
  return (
    <Drawer side="bottom">
      <DrawerTrigger className={TRIGGER_CLS}>Open bottom</DrawerTrigger>
      <DrawerContent size="sm">
        <DrawerClose />
        <DrawerHeader>
          <DrawerTitle>Mobile sheet</DrawerTitle>
          <DrawerDescription>Slides up from the bottom edge.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>Sheet content.</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

/* --------------------------------- popover --------------------------------- */

function QuickActionsPopover() {
  const [stars, setStars] = useState(12);
  return (
    <Popover>
      <PopoverTrigger className={TRIGGER_CLS}>Quick actions · {stars} ★</PopoverTrigger>
      <PopoverContent className="relative">
        <PopoverArrow className="absolute -top-1.5 left-1/2 -translate-x-1/2 rotate-180" />
        <h3 className="mb-1 text-sm font-semibold text-foreground">Repository</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Starring updates the trigger label live.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setStars((s) => s + 1)}>
            Star
          </Button>
          <Button size="sm" variant="outline" onClick={() => setStars(12)}>
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TopPopover() {
  return (
    <Popover placement="top">
      <PopoverTrigger className={TRIGGER_CLS}>Top placement</PopoverTrigger>
      <PopoverContent className="relative">
        <PopoverArrow className="absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
        <p className="text-sm text-foreground">Anchored above the trigger.</p>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------- hover card -------------------------------- */

function ProfileHoverCard() {
  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger>
        <button type="button" className="text-sm font-medium text-primary underline underline-offset-2">
          @wow-two
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="relative">
        <HoverCardArrow className="absolute -top-1.5 left-1/2 -translate-x-1/2 rotate-180" />
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            W
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-foreground">WoW Two</h4>
            <p className="text-xs text-muted-foreground">
              Beta-forever React UI library. Foundation + domain layering.
            </p>
            <p className="text-xs text-subtle-foreground">42 packages · est. 2024</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/* -------------------------------- action sheet ------------------------------ */

function PhotoActionSheet() {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState('none yet');
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Photo actions
      </Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title="IMG_0412.jpg"
        description="What would you like to do with this photo?"
      >
        <ActionSheetAction onSelect={() => setLastAction('Save to album')}>
          Save to album
        </ActionSheetAction>
        <ActionSheetAction onSelect={() => setLastAction('Share')}>Share</ActionSheetAction>
        <ActionSheetAction isDestructive onSelect={() => setLastAction('Delete')}>
          Delete
        </ActionSheetAction>
        <ActionSheetCancel />
      </ActionSheet>
      <span className="text-sm text-muted-foreground">
        Last action: <span className="text-foreground">{lastAction}</span>
      </span>
    </>
  );
}

/* -------------------------------- bottom sheet ------------------------------ */

function SnapReadout() {
  const { currentSnap, snapPoints } = useBottomSheet();
  return (
    <p className="text-xs text-subtle-foreground">
      Snap {currentSnap + 1} of {snapPoints.length} ({String(snapPoints[currentSnap] ?? '—')})
    </p>
  );
}

function ResizableBottomSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open bottom sheet
      </Button>
      <BottomSheet open={open} onOpenChange={setOpen} snapPoints={['35vh', '70vh']} initialSnap={0}>
        <BottomSheetTitle className="mb-1">Nearby places</BottomSheetTitle>
        <BottomSheetDescription>
          Drag the handle to resize; drag below the lowest snap to dismiss. Focused handle: ↑/↓.
        </BottomSheetDescription>
        <div className="mt-2">
          <SnapReadout />
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {['Cafe Mocha', 'City Library', 'Riverside Park', 'Art Museum', 'Night Market'].map(
            (place) => (
              <li key={place} className="rounded-md border border-border p-3 text-sm text-foreground">
                {place}
              </li>
            ),
          )}
        </ul>
      </BottomSheet>
    </>
  );
}

/* --------------------------------- backdrop -------------------------------- */

function ContainedBackdrop({ blur }: { blur?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Content under the scrim — click the scrim to dismiss.
        </p>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Show {blur ? 'blurred ' : ''}scrim
        </Button>
      </div>
      <Backdrop
        open={open}
        isInline
        isBlurred={blur}
        onClick={() => setOpen(false)}
        className="absolute z-10 cursor-pointer"
      />
    </div>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function OverlaysGallery() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Dialog"
        description="Modal dialog — trigger, focus trap, header/body/footer chrome, outside-click + Escape dismissal."
      >
        <Demo label="Dialog · controlled draft commit">
          <RenameProjectDialog />
        </Demo>
        <Demo label="DialogContent blur">
          <BlurredDialog />
        </Demo>
      </Section>

      <Section
        title="Alert Dialog"
        description="Confirmation modal (role=alertdialog) — outside-click dismissal disabled; explicit Action / Cancel."
      >
        <Demo label="AlertDialog + AlertDialogAction / AlertDialogCancel">
          <ArchiveAlertDialog />
        </Demo>
      </Section>

      <Section
        title="Drawer"
        description="Edge-anchored panel — right / left / bottom sides, size tokens, shared overlay chrome."
      >
        <Demo label="Drawer side=right (default)">
          <RightDrawer />
        </Demo>
        <Demo label="Drawer side=left · size=sm">
          <LeftDrawer />
        </Demo>
        <Demo label="Drawer side=bottom">
          <BottomDrawer />
        </Demo>
      </Section>

      <Section
        title="Popover"
        description="Click-anchored floating surface — placements, arrow, focus trap, live state inside."
      >
        <Demo label="Popover · interactive content">
          <QuickActionsPopover />
        </Demo>
        <Demo label="Popover placement=top + PopoverArrow">
          <TopPopover />
        </Demo>
      </Section>

      <Section
        title="Hover Card"
        description="Hover/focus-anchored preview card with open/close delays — dismissible via Escape."
      >
        <Demo label="HoverCard · profile preview (hover the handle)">
          <ProfileHoverCard />
        </Demo>
      </Section>

      <Section
        title="Action Sheet"
        description="iOS-style bottom sheet of stacked actions with a separated Cancel — built on Drawer."
      >
        <Demo label="ActionSheet + ActionSheetAction / ActionSheetCancel">
          <PhotoActionSheet />
        </Demo>
      </Section>

      <Section
        title="Bottom Sheet"
        description="Draggable mobile sheet with snap points — drag to resize, drag past the lowest snap to dismiss."
      >
        <Demo label="BottomSheet · snapPoints 35vh / 70vh + useBottomSheet readout">
          <ResizableBottomSheet />
        </Demo>
      </Section>

      <Section
        title="Backdrop"
        description="Standalone scrim — demoed inline inside a relative container (no portal), plain and blurred."
      >
        <Demo label="Backdrop inline">
          <ContainedBackdrop />
        </Demo>
        <Demo label="Backdrop inline blur">
          <ContainedBackdrop blur />
        </Demo>
      </Section>
    </div>
  );
}
