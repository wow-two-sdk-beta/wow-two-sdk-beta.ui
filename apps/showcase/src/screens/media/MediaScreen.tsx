import { useEffect, useRef, useState } from 'react';
import {
  BackToTopButton,
  Button,
  FAB,
  SpeedDial,
  SpeedDialAction,
  SpeedDialTrigger,
} from '@wow-two-beta/ui/actions';
import {
  AudioPlayer,
  AudioWaveform,
  Badge,
  BadgeOverlay,
  Carousel,
  CarouselDots,
  CarouselNext,
  CarouselPrev,
  CarouselSlide,
  CarouselSlides,
  CarouselViewport,
  GradientText,
  Image,
  Marquee,
  PDFViewer,
  ScrollReveal,
  SectionHeader,
  Tilt,
  Tooltip,
  VideoPlayer,
} from '@wow-two-beta/ui/display';
import { useToaster } from '@wow-two-beta/ui/feedback';
import { AspectRatio, Frame } from '@wow-two-beta/ui/layout';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@wow-two-beta/ui/overlays';
import { files, usersById } from '../../fixtures';

/* ------------------------------------------------------------------ data */

type MediaKind = 'photo' | 'render' | 'diagram';

interface MediaItem {
  id: string;
  title: string;
  caption: string;
  src: string;
  kind: MediaKind;
  sizeKb: number;
  ownerId: string;
}

const KIND_BADGE: Record<MediaKind, 'brand' | 'info' | 'success'> = {
  photo: 'brand',
  render: 'info',
  diagram: 'success',
};

const MEDIA: MediaItem[] = [
  {
    id: 'med-001',
    title: 'Aurora over the ridge',
    caption: 'Hero artwork for the Q3 launch announcement.',
    src: '/samples/poster-aurora.svg',
    kind: 'photo',
    sizeKb: 2,
    ownerId: 'usr-002',
  },
  {
    id: 'med-002',
    title: 'Golden hour dunes',
    caption: 'Warm-palette cover used in the billing emails.',
    src: '/samples/poster-dunes.svg',
    kind: 'photo',
    sizeKb: 2,
    ownerId: 'usr-004',
  },
  {
    id: 'med-003',
    title: 'Edge node topology',
    caption: 'Infra diagram from the deploy pipeline runbook.',
    src: '/samples/poster-circuit.svg',
    kind: 'diagram',
    sizeKb: 2,
    ownerId: 'usr-005',
  },
  {
    id: 'med-004',
    title: 'Tidal layers',
    caption: 'Render exploration for the marketing splash.',
    src: '/samples/poster-waves.svg',
    kind: 'render',
    sizeKb: 1,
    ownerId: 'usr-007',
  },
  {
    id: 'med-005',
    title: 'Violet summit line',
    caption: 'Night-mode wallpaper shipped with the desktop app.',
    src: '/samples/poster-summit.svg',
    kind: 'render',
    sizeKb: 2,
    ownerId: 'usr-009',
  },
  {
    id: 'med-006',
    title: 'Release 2.4 walkthrough',
    caption: 'Poster frame for the release video (source pending).',
    src: '/samples/poster-video.svg',
    kind: 'diagram',
    sizeKb: 2,
    ownerId: 'usr-011',
  },
];

const CAROUSEL_ITEMS = MEDIA.slice(0, 5);

/* Deterministic synthetic waveform peaks (0..1) — fixed math, no randomness. */
const AUDIO_PEAKS: number[] = Array.from({ length: 64 }, (_, i) => {
  const v = 0.5 + 0.32 * Math.sin(i * 0.42) + 0.16 * Math.sin(i * 1.7);
  return Math.round(Math.min(0.98, Math.max(0.08, v)) * 100) / 100;
});

function formatKb(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function ownerName(id: string): string {
  return usersById[id]?.name ?? 'Unknown owner';
}

/* ----------------------------------------------------------- tiny glyphs */

function UploadGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 11V3M4.5 6.5L8 3l3.5 3.5M3 13h10" />
    </svg>
  );
}

function FolderGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.4 1.7h5A1.5 1.5 0 0 1 14 6.2v5.3a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-7z" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="4" cy="8" r="2" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" />
      <path d="M5.8 7.1l4.4-2.2M5.8 8.9l4.4 2.2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ page */

export default function MediaScreen() {
  const { toast } = useToaster();
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [waveProgress, setWaveProgress] = useState(0.35);
  const [uploadCount, setUploadCount] = useState(0);

  /* The showcase AppShell scrolls its content pane, not the window — find
     the nearest scrollable ancestor for BackToTopButton. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let node: HTMLElement | null = rootRef.current?.parentElement ?? null;
    while (node) {
      const { overflowY } = window.getComputedStyle(node);
      if (overflowY === 'auto' || overflowY === 'scroll') break;
      node = node.parentElement;
    }
    setScrollEl(node);
  }, []);

  const active = MEDIA.find((m) => m.id === lightboxId) ?? null;

  const recordUpload = (label: string) => {
    setUploadCount((n) => n + 1);
    toast({
      title: label,
      description: 'Added to the media library (local demo state).',
      severity: 'success',
    });
  };

  return (
    <div ref={rootRef} className="mx-auto flex max-w-5xl flex-col gap-10 pb-24">
      {/* Hero — GradientText + Marquee flourish */}
      <header className="space-y-4">
        <GradientText as="h1" animated direction="r" className="text-3xl font-bold tracking-tight">
          Media library
        </GradientText>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Posters, audio, video and documents — every asset on this page is a tiny local
          sample generated for the showcase. Click any tile to open the lightbox.
        </p>
        <Frame surface="muted" padding="0" radius="lg" className="overflow-hidden">
          <Marquee speed={36} gap={40} className="py-2.5">
            {files.map((f) => (
              <span
                key={f.id}
                className="mx-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">{f.name}</span>
                {formatKb(f.sizeKb)}
              </span>
            ))}
          </Marquee>
        </Frame>
      </header>

      {/* Image grid — BadgeOverlay + Tooltip captions, Dialog lightbox */}
      <section className="space-y-4">
        <SectionHeader
          title="Library"
          description="Six assets with kind badges — hover for the caption, click to inspect."
          actions={
            <Badge variant="outline" size="md">
              {MEDIA.length + uploadCount} assets
            </Badge>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MEDIA.map((item) => (
            <BadgeOverlay
              key={item.id}
              className="w-full"
              position="top-right"
              badge={
                <Badge size="sm" variant={KIND_BADGE[item.kind]}>
                  {item.kind}
                </Badge>
              }
            >
              <Tooltip
                content={`${item.title} — ${ownerName(item.ownerId)}`}
                placement="top"
                openDelay={250}
              >
                <button
                  type="button"
                  onClick={() => setLightboxId(item.id)}
                  className="group w-full overflow-hidden rounded-lg border border-border bg-card text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <AspectRatio ratio={4 / 3} className="overflow-hidden">
                    <Image
                      src={item.src}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallback={
                        <div className="absolute inset-0 grid place-items-center bg-muted text-xs text-muted-foreground">
                          Preview unavailable
                        </div>
                      }
                    />
                  </AspectRatio>
                  <span className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate text-xs font-medium text-foreground">{item.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatKb(item.sizeKb)}
                    </span>
                  </span>
                </button>
              </Tooltip>
            </BadgeOverlay>
          ))}
        </div>
      </section>

      {/* Lightbox — controlled Dialog, mounted behind the grid buttons */}
      <Dialog open={active !== null} onOpenChange={(open) => { if (!open) setLightboxId(null); }}>
        {active !== null && (
          <DialogContent className="max-w-3xl">
            <DialogClose />
            <DialogHeader>
              <DialogTitle>{active.title}</DialogTitle>
              <DialogDescription>{active.caption}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md border border-border">
                <Image
                  src={active.src}
                  alt={active.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AspectRatio>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge size="sm" variant={KIND_BADGE[active.kind]}>{active.kind}</Badge>
                <span>{formatKb(active.sizeKb)}</span>
                <span>·</span>
                <span>Owner: {ownerName(active.ownerId)}</span>
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" tone="neutral" size="sm">
                  Close
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Link copied',
                    description: `${active.src} (demo — clipboard untouched)`,
                    severity: 'info',
                  })
                }
              >
                Copy link
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Carousel */}
      <ScrollReveal as="section" effect="slide-up" className="space-y-4">
        <SectionHeader
          title="Featured reel"
          description="Looping carousel of the poster set — arrow keys work while focused."
        />
        <Carousel loop>
          <CarouselViewport aria-label="Featured posters">
            <CarouselSlides>
              {CAROUSEL_ITEMS.map((item) => (
                <CarouselSlide key={item.id}>
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={item.src}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-background/80 px-4 py-2 text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                  </AspectRatio>
                </CarouselSlide>
              ))}
            </CarouselSlides>
          </CarouselViewport>
          <CarouselPrev />
          <CarouselNext />
          <CarouselDots />
        </Carousel>
      </ScrollReveal>

      {/* AspectRatio / Frame / Tilt */}
      <ScrollReveal as="section" effect="slide-up" delay={80} className="space-y-4">
        <SectionHeader
          title="Frames & ratios"
          description="AspectRatio locks media boxes, Frame is the chrome-less card, Tilt adds pointer depth."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            { ratio: 16 / 9, label: '16 : 9', src: '/samples/poster-waves.svg' },
            { ratio: 4 / 3, label: '4 : 3', src: '/samples/poster-dunes.svg' },
            { ratio: 1, label: '1 : 1', src: '/samples/poster-summit.svg' },
          ] as const).map((demo) => (
            <Frame key={demo.label} padding="2" radius="lg" className="space-y-2">
              <AspectRatio ratio={demo.ratio} className="overflow-hidden rounded-md">
                <Image
                  src={demo.src}
                  alt={`${demo.label} crop`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AspectRatio>
              <div className="px-1 pb-1 text-center text-xs text-muted-foreground">{demo.label}</div>
            </Frame>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Frame surface="card" padding="4" radius="md">
            <div className="text-xs font-medium text-foreground">Frame · card</div>
            <p className="mt-1 text-xs text-muted-foreground">Raised surface for grouped media meta.</p>
          </Frame>
          <Frame surface="muted" padding="4" radius="md">
            <div className="text-xs font-medium text-foreground">Frame · muted</div>
            <p className="mt-1 text-xs text-muted-foreground">Recessed well — good behind waveforms.</p>
          </Frame>
          <Tilt glare scale={1.03} maxAngle={10} className="rounded-md">
            <Frame surface="card" padding="0" radius="md" className="overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src="/samples/poster-aurora.svg"
                  alt="Tilt demo poster"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AspectRatio>
              <div className="px-3 py-2 text-xs text-muted-foreground">Tilt · hover me</div>
            </Frame>
          </Tilt>
        </div>
      </ScrollReveal>

      {/* Audio */}
      <ScrollReveal as="section" effect="slide-up" delay={80} className="space-y-4">
        <SectionHeader
          title="Audio"
          description="AudioPlayer over a generated 1-second silent WAV, plus a standalone seekable waveform."
        />
        <Frame padding="4" radius="lg">
          <AudioPlayer src="/samples/silence.wav" peaks={AUDIO_PEAKS} />
        </Frame>
        <Frame surface="muted" padding="4" radius="lg" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Static AudioWaveform — click or use arrow keys to seek</span>
            <span className="font-medium text-foreground">{Math.round(waveProgress * 100)}%</span>
          </div>
          <AudioWaveform
            peaks={AUDIO_PEAKS}
            progress={waveProgress}
            onSeek={setWaveProgress}
            width={640}
            height={64}
            barWidth={3}
            gap={2}
            tone="brand"
            className="w-full"
          />
        </Frame>
      </ScrollReveal>

      {/* Video */}
      <ScrollReveal as="section" effect="slide-up" delay={80} className="space-y-4">
        <SectionHeader
          title="Video"
          description="VideoPlayer with a poster frame and an intentionally empty source — controls stay graceful."
        />
        <VideoPlayer
          src=""
          poster="/samples/poster-video.svg"
          aspectRatio="16 / 9"
          muted
          className="overflow-hidden rounded-lg border border-border"
        />
      </ScrollReveal>

      {/* PDF */}
      <ScrollReveal as="section" effect="slide-up" delay={80} className="space-y-4">
        <SectionHeader
          title="Documents"
          description="PDFViewer over a hand-assembled 900-byte one-page PDF served from /samples."
        />
        <PDFViewer
          src="/samples/sample.pdf"
          title="Sample one-pager"
          pageCount={1}
          height="28rem"
        />
      </ScrollReveal>

      {/* Floating actions — FAB, SpeedDial, BackToTopButton */}
      <FAB
        aria-label="Quick upload"
        position="bottom-left"
        size="sm"
        variant="secondary"
        onClick={() => recordUpload('Quick upload complete')}
      >
        <UploadGlyph />
      </FAB>

      <SpeedDial position="bottom-right">
        <SpeedDialAction
          aria-label="Upload asset"
          tooltip="Upload asset"
          icon={<UploadGlyph />}
          onSelect={() => recordUpload('Asset uploaded')}
        />
        <SpeedDialAction
          aria-label="New folder"
          tooltip="New folder"
          icon={<FolderGlyph />}
          onSelect={() =>
            toast({ title: 'Folder created', description: 'samples/new-folder (demo)', severity: 'neutral' })
          }
        />
        <SpeedDialAction
          aria-label="Share library"
          tooltip="Share library"
          icon={<ShareGlyph />}
          onSelect={() =>
            toast({ title: 'Share link ready', description: 'Visible to the demo workspace only.', severity: 'info' })
          }
        />
        <SpeedDialTrigger aria-label="Open media actions" size="sm" />
      </SpeedDial>

      <BackToTopButton
        scrollContainer={scrollEl}
        position="bottom-center"
        threshold={320}
        label="Top"
      />
    </div>
  );
}
