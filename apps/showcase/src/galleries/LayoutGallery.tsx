import { useState, type ReactNode } from 'react';
import {
  AppShell,
  AppShellAside,
  AppShellContent,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  AspectRatio,
  Box,
  Center,
  Cluster,
  Container,
  Flex,
  Frame,
  Grid,
  HStack,
  Inline,
  Overlay,
  PullToRefresh,
  ResizablePanel,
  ResizablePanels,
  ResizableSeparator,
  ScrollArea,
  Spacer,
  Stack,
  Surface,
  TwoColumn,
  VStack,
} from '@wow-two-beta/ui/layout';
import { SectionHeader } from '@wow-two-beta/ui/display';
import { Button } from '@wow-two-beta/ui/actions';

/* ------------------------------------------------------------------ */
/* Local demo scaffolding (plain divs — not part of coverage)          */
/* ------------------------------------------------------------------ */

function Demo({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Cell({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={`flex h-10 min-w-10 items-center justify-center rounded-md border border-border bg-muted px-2 text-xs text-muted-foreground ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

const NAV_ITEMS = ['Dashboard', 'Inbox', 'Projects', 'Settings'] as const;
const SCROLL_ROWS = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot',
  'Golf', 'Hotel', 'India', 'Juliett', 'Kilo', 'Lima',
] as const;

/* ------------------------------------------------------------------ */
/* Gallery                                                             */
/* ------------------------------------------------------------------ */

export default function LayoutGallery() {
  const [stampVisible, setStampVisible] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefresh = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setRefreshCount((c) => c + 1);
        resolve();
      }, 700);
    });

  return (
    <Stack gap="10" className="pb-16">
      {/* ---------------- Stack primitives ---------------- */}
      <section>
        <SectionHeader
          title="Stack primitives"
          description="Stack · VStack · HStack · Flex · Box · Spacer"
        />
        <Grid columns="2" gap="6" className="mt-4">
          <Demo label="Stack — direction row, gap 2, wrap">
            <Stack direction="row" gap="2" wrap="wrap">
              <Cell>1</Cell>
              <Cell>2</Cell>
              <Cell>3</Cell>
              <Cell>4</Cell>
            </Stack>
          </Demo>
          <Demo label="VStack — gap 2, align start">
            <VStack gap="2" align="start">
              <Cell>top</Cell>
              <Cell>middle</Cell>
              <Cell>bottom</Cell>
            </VStack>
          </Demo>
          <Demo label="HStack — gap 3, justify between">
            <HStack gap="3" justify="between">
              <Cell>start</Cell>
              <Cell>mid</Cell>
              <Cell>end</Cell>
            </HStack>
          </Demo>
          <Demo label="Flex — bare flex, items-end via className">
            <Flex className="items-end gap-2">
              <Cell className="h-8">8</Cell>
              <Cell className="h-12">12</Cell>
              <Cell className="h-16">16</Cell>
            </Flex>
          </Demo>
          <Demo label="Box — as='section', styling shell">
            <Box as="section" className="rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
              Box renders any element — this one is a <code className="text-foreground">&lt;section&gt;</code>.
            </Box>
          </Demo>
          <Demo label="Spacer — flexible (pushes apart) + fixed size">
            <VStack gap="2">
              <HStack gap="0" className="rounded-md border border-dashed border-border p-2">
                <Cell>left</Cell>
                <Spacer />
                <Cell>right</Cell>
              </HStack>
              <HStack gap="0" className="rounded-md border border-dashed border-border p-2">
                <Cell>a</Cell>
                <Spacer size={48} />
                <Cell>b — fixed 48px gap</Cell>
              </HStack>
            </VStack>
          </Demo>
        </Grid>
      </section>

      {/* ---------------- Grid & Container ---------------- */}
      <section>
        <SectionHeader title="Grid & Container" description="Grid · Container" />
        <VStack gap="6" className="mt-4">
          <Demo label="Grid — columns 3, gap 3">
            <Grid columns="3" gap="3">
              <Cell>1</Cell>
              <Cell>2</Cell>
              <Cell>3</Cell>
              <Cell>4</Cell>
              <Cell>5</Cell>
              <Cell>6</Cell>
            </Grid>
          </Demo>
          <Demo label="Container — size sm, centered max-width">
            <div className="rounded-md border border-dashed border-border py-3">
              <Container size="sm">
                <Cell className="h-12">constrained to max-w-screen-sm</Cell>
              </Container>
            </div>
          </Demo>
        </VStack>
      </section>

      {/* ---------------- Wrapping rows ---------------- */}
      <section>
        <SectionHeader title="Wrapping rows" description="Inline · Cluster" />
        <Grid columns="2" gap="6" className="mt-4">
          <Demo label="Inline — left-aligned tag row, gap 2">
            <Inline gap="2">
              {['layout', 'react', 'tokens', 'beta', 'ui', 'showcase'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </Inline>
          </Demo>
          <Demo label="Cluster — centered action cluster, gap 3">
            <Cluster gap="3" className="rounded-md border border-dashed border-border p-4">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">
                Secondary
              </Button>
              <Button size="sm" variant="ghost">
                Tertiary
              </Button>
            </Cluster>
          </Demo>
        </Grid>
      </section>

      {/* ---------------- Centering & ratio ---------------- */}
      <section>
        <SectionHeader title="Centering & ratio" description="Center · AspectRatio" />
        <Grid columns="2" gap="6" className="mt-4">
          <Demo label="Center — both axes">
            <Center className="h-28 rounded-md border border-dashed border-border">
              <Cell>centered</Cell>
            </Center>
          </Demo>
          <Demo label="AspectRatio — 16:9 and 1:1">
            <HStack gap="3" align="start">
              <AspectRatio ratio={16 / 9} className="w-48">
                <div className="absolute inset-0 flex items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
                  16 : 9
                </div>
              </AspectRatio>
              <AspectRatio ratio={1} className="w-24">
                <div className="absolute inset-0 flex items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
                  1 : 1
                </div>
              </AspectRatio>
            </HStack>
          </Demo>
        </Grid>
      </section>

      {/* ---------------- Surfaces & frames ---------------- */}
      <section>
        <SectionHeader title="Surfaces & frames" description="Frame · Surface" />
        <VStack gap="6" className="mt-4">
          <Demo label="Frame — card (raised) vs muted (recessed) vs borderless">
            <Grid columns="3" gap="3">
              <Frame padding="4">
                <p className="text-xs text-muted-foreground">surface=&quot;card&quot;</p>
              </Frame>
              <Frame padding="4" surface="muted" radius="lg">
                <p className="text-xs text-muted-foreground">surface=&quot;muted&quot; radius=&quot;lg&quot;</p>
              </Frame>
              <Frame padding="4" bordered={false} surface="muted">
                <p className="text-xs text-muted-foreground">bordered=&#123;false&#125;</p>
              </Frame>
            </Grid>
          </Demo>
          <Demo label="Surface — variant × tone matrix sample">
            <Grid columns="3" gap="3">
              <Surface variant="solid" tone="primary" padding="md" radius="lg">
                <p className="text-xs">solid / primary</p>
              </Surface>
              <Surface variant="soft" tone="info" padding="md" radius="lg">
                <p className="text-xs">soft / info</p>
              </Surface>
              <Surface variant="outline" tone="success" padding="md" radius="lg">
                <p className="text-xs">outline / success</p>
              </Surface>
              <Surface variant="surface" tone="warning" padding="md" radius="lg">
                <p className="text-xs">surface / warning</p>
              </Surface>
              <Surface variant="elevated" tone="neutral" padding="md" radius="lg" elevation={3}>
                <p className="text-xs">elevated / elevation 3</p>
              </Surface>
              <div className="relative overflow-hidden rounded-lg border border-border bg-muted p-2">
                <Surface variant="glass-outline" tone="neutral" padding="md" radius="lg">
                  <p className="text-xs">glass-outline</p>
                </Surface>
              </div>
            </Grid>
          </Demo>
        </VStack>
      </section>

      {/* ---------------- Scroll & panes ---------------- */}
      <section>
        <SectionHeader
          title="Scroll & panes"
          description="ScrollArea · TwoColumn · ResizablePanels"
        />
        <VStack gap="6" className="mt-4">
          <Grid columns="2" gap="6">
            <Demo label="ScrollArea — vertical, h-32">
              <ScrollArea className="h-32 rounded-md border border-border">
                <ul className="divide-y divide-border">
                  {SCROLL_ROWS.map((row) => (
                    <li key={row} className="px-3 py-2 text-xs text-muted-foreground">
                      {row}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </Demo>
            <Demo label="ScrollArea — horizontal">
              <ScrollArea axis="horizontal" className="rounded-md border border-border p-3">
                <HStack gap="2" wrap="nowrap" className="w-max">
                  {SCROLL_ROWS.map((row) => (
                    <Cell key={row} className="shrink-0">
                      {row}
                    </Cell>
                  ))}
                </HStack>
              </ScrollArea>
            </Demo>
          </Grid>
          <Demo label="TwoColumn — fixed aside + flexible main">
            <TwoColumn
              aside={
                <Frame padding="3" surface="muted" className="h-full">
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {NAV_ITEMS.map((item) => (
                      <li key={item} className="rounded px-2 py-1 hover:bg-background">
                        {item}
                      </li>
                    ))}
                  </ul>
                </Frame>
              }
              asideWidth="w-40"
              gap="4"
              className="rounded-md border border-dashed border-border p-3"
            >
              <p className="text-xs text-muted-foreground">
                Main column flexes to fill the remaining width. Classic sidebar + content,
                filter + results, or table-of-contents + article shape.
              </p>
            </TwoColumn>
          </Demo>
          <Demo label="ResizablePanels — drag the separator, double-click to reset, arrows when focused">
            <div className="h-36 overflow-hidden rounded-md border border-border">
              <ResizablePanels defaultSizes={[35, 65]}>
                <ResizablePanel minSize={15} className="bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Left panel (min 15%)</p>
                </ResizablePanel>
                <ResizableSeparator />
                <ResizablePanel minSize={20} className="p-3">
                  <p className="text-xs text-muted-foreground">Right panel (min 20%)</p>
                </ResizablePanel>
              </ResizablePanels>
            </div>
          </Demo>
        </VStack>
      </section>

      {/* ---------------- Overlay ---------------- */}
      <section>
        <SectionHeader
          title="Overlay"
          description="Anchored to nearest positioned ancestor — static, hover-revealed, presence-toggled"
        />
        <Grid columns="3" gap="6" className="mt-4">
          <Demo label="Overlay — always visible, top-right badge">
            <div className="relative h-28 rounded-md border border-border bg-muted">
              <Overlay position="top-right">
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  NEW
                </span>
              </Overlay>
            </div>
          </Demo>
          <Demo label="Overlay — appearOn='hover' (hover the box)">
            <div className="group relative h-28 overflow-hidden rounded-md border border-border bg-muted">
              <Overlay position="bottom" appearOn="hover" transition="fade-slide-up">
                <span className="rounded-md border border-border bg-card px-2 py-1 text-xs shadow-md">
                  Hover actions
                </span>
              </Overlay>
            </div>
          </Demo>
          <Demo label="Overlay — presence mode (isOpen)">
            <VStack gap="2">
              <div className="relative h-20 rounded-md border border-border bg-muted">
                <Overlay isOpen={stampVisible} position="center" transition="fade-scale">
                  <span className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground shadow-md">
                    Stamped
                  </span>
                </Overlay>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStampVisible((v) => !v)}>
                {stampVisible ? 'Hide overlay' : 'Show overlay'}
              </Button>
            </VStack>
          </Demo>
        </Grid>
      </section>

      {/* ---------------- Pull to refresh ---------------- */}
      <section>
        <SectionHeader
          title="Pull to refresh"
          description="PullToRefresh — drag down from the top of the list"
        />
        <Demo label={`PullToRefresh — refreshed ${refreshCount}×`} className="mt-4">
          <div className="h-44 touch-none overflow-hidden rounded-md border border-border">
            <PullToRefresh onRefresh={handleRefresh} className="h-full">
              <ul className="divide-y divide-border">
                {SCROLL_ROWS.map((row) => (
                  <li key={row} className="px-3 py-2 text-xs text-muted-foreground">
                    Feed item — {row}
                  </li>
                ))}
              </ul>
            </PullToRefresh>
          </div>
        </Demo>
      </section>

      {/* ---------------- App shell (miniature) ---------------- */}
      <section>
        <SectionHeader
          title="App shell"
          description="AppShell — header / sidebar / main / aside / footer, framed miniature"
        />
        <Demo label="AppShell — miniature framed demo" className="mt-4">
          <div className="h-72 overflow-hidden rounded-lg border border-border">
            <AppShell
              sidebarWidth="150px"
              asideWidth="130px"
              sidebarBreakpoint="sm"
              asideBreakpoint="sm"
              className="h-full min-h-0"
            >
              <AppShellHeader className="static h-10 px-3 text-sm">
                <span className="font-semibold">Acme</span>
                <span className="ml-auto text-xs text-muted-foreground">user@acme.dev</span>
              </AppShellHeader>
              <AppShellSidebar className="static h-auto">
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <li key={item}>
                      <span className="block rounded-md px-2 py-1 text-xs text-foreground hover:bg-muted">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </AppShellSidebar>
              <AppShellMain>
                <div className="flex min-h-0 flex-1">
                  <AppShellContent className="p-3">
                    <p className="text-sm font-medium">Dashboard</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Grid shell: header · sidebar · main · aside · footer. Below the
                      breakpoint the sidebar collapses into a drawer.
                    </p>
                    <Grid columns="2" gap="2" className="mt-3">
                      <Cell>KPI 1</Cell>
                      <Cell>KPI 2</Cell>
                    </Grid>
                  </AppShellContent>
                  <AppShellAside className="static h-auto p-3">
                    <p className="text-xs font-medium">On this page</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <li>Intro</li>
                      <li>Setup</li>
                      <li>API</li>
                    </ul>
                  </AppShellAside>
                </div>
              </AppShellMain>
              <AppShellFooter className="px-3 py-1.5 text-xs">
                © Acme — built with @wow-two-beta/ui
              </AppShellFooter>
            </AppShell>
          </div>
        </Demo>
      </section>
    </Stack>
  );
}
