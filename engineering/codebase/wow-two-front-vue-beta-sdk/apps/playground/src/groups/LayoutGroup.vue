<script setup lang="ts">
import * as layout from '@wow-two-beta/ui-vue/presentation/layout';
import { cn } from '@wow-two-beta/ui-vue/foundation/utils';
import Demo from '../gallery/Demo.vue';
import Matrix from '../gallery/Matrix.vue';
import AutoGroup from '../gallery/AutoGroup.vue';

const {
  Box,
  Stack,
  HStack,
  VStack,
  Grid,
  Container,
  Flex,
  AspectRatio,
  Spacer,
  Center,
  Divider,
  ControlGroup,
  ScrollArea,
  Inline,
  Cluster,
  Frame,
  TwoColumn,
  Surface,
  Section,
  Navbar,
  ResizablePanels,
  ResizablePanel,
  ResizableSeparator,
  Overlay,
} = layout;

/** Names every component the curated section below renders. */
const covered = [
  'Box',
  'Stack',
  'HStack',
  'VStack',
  'Grid',
  'Container',
  'Flex',
  'AspectRatio',
  'Spacer',
  'Center',
  'Divider',
  'ControlGroup',
  'ScrollArea',
  'Inline',
  'Cluster',
  'Frame',
  'TwoColumn',
  'Surface',
  'Section',
  'Navbar',
  'ResizablePanels',
  'ResizablePanel',
  'ResizableSeparator',
  'Overlay',
];

const SURFACE_VARIANTS = [
  'solid',
  'soft',
  'surface',
  'outline',
  'glass',
  'glass-outline',
  'elevated',
  'flat',
  'subtle',
] as const;
const TONES = ['neutral', 'primary', 'danger', 'success', 'warning', 'info'] as const;
const GAPS = ['0', '1', '2', '4', '8', '12'] as const;
const DIRECTIONS = ['row', 'column', 'row-reverse', 'column-reverse'] as const;

/** The `max-width` each `Container` size resolves to — printed so the axis is readable
    even at the steps that clamp to `w-full` on a narrow viewport. */
const CONTAINER_MAX: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: 'none',
};

/** `Flex` has no variant axes, so the demo drives it through fallthrough utilities. */
const FLEX_CASES = [
  { label: 'gap-2', class: 'gap-2' },
  { label: 'gap-2 justify-between', class: 'gap-2 justify-between' },
  { label: 'gap-2 flex-col (h-auto)', class: 'gap-2 flex-col !h-auto' },
  { label: 'gap-2 items-end', class: 'gap-2 items-end' },
] as const;
</script>

<template>
  <div class="space-y-6">
    <h2 class="font-mono text-sm font-bold uppercase tracking-wide">layout</h2>

    <!-- The single most load-bearing matrix in the package: 9 variants × 6 tones.
         If the cells do not differ, `cn()` / `surfaceVariants` dropped the axis. -->
    <Demo name="Surface" note="variant × tone — the widest variant matrix in the lib">
      <Matrix row-axis="variant" col-axis="tone" :rows="SURFACE_VARIANTS" :cols="TONES">
        <template #default="{ row, col }">
          <Surface :variant="row as never" :tone="col as never" padding="sm" radius="md">
            <span class="whitespace-nowrap text-xs">Aa</span>
          </Surface>
        </template>
      </Matrix>
    </Demo>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
      <!-- 7 × 6. In a 320px track this grew an inner horizontal scrollbar, and two
           axes you have to scroll between cannot be compared. -->
      <Demo name="Surface" note="radius × elevation" is-wide>
        <Matrix
          row-axis="radius"
          col-axis="elevation"
          :rows="['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full']"
          :cols="['0', '1', '2', '3', '4', '5']"
        >
          <template #default="{ row, col }">
            <Surface variant="elevated" :radius="row as never" :elevation="col as never" padding="sm">
              <span class="text-xs">Aa</span>
            </Surface>
          </template>
        </Matrix>
      </Demo>

      <Demo name="Surface" note="padding scale">
        <Matrix
          row-axis="padding"
          :rows="['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']"
        >
          <template #default="{ row }">
            <Surface variant="outline" :padding="row as never" radius="md" class="inline-block">
              <span class="text-xs">box</span>
            </Surface>
          </template>
        </Matrix>
      </Demo>

      <Demo name="Stack" note="direction × gap" is-wide>
        <Matrix row-axis="direction" col-axis="gap" :rows="DIRECTIONS" :cols="GAPS">
          <template #default="{ row, col }">
            <Stack :direction="row as never" :gap="col as never">
              <div class="size-3 rounded-xs bg-primary" />
              <div class="size-3 rounded-xs bg-accent" />
              <div class="size-3 rounded-xs bg-destructive" />
            </Stack>
          </template>
        </Matrix>
      </Demo>

      <Demo name="Stack" note="align × justify inside a fixed 120×48 box" is-wide>
        <Matrix
          row-axis="align"
          col-axis="justify"
          :rows="['start', 'center', 'end', 'stretch', 'baseline']"
          :cols="['start', 'center', 'end', 'between', 'around', 'evenly']"
        >
          <template #default="{ row, col }">
            <Stack
              direction="row"
              :align="row as never"
              :justify="col as never"
              class="h-12 w-28 rounded-xs bg-muted"
            >
              <div class="size-2 bg-primary" />
              <div class="size-4 bg-accent" />
            </Stack>
          </template>
        </Matrix>
      </Demo>

      <Demo name="HStack / VStack" note="direction-locked Stack wrappers">
        <div class="space-y-2">
          <HStack gap="2">
            <div class="rounded-xs bg-primary px-2 py-1 text-xs text-primary-foreground">h1</div>
            <div class="rounded-xs bg-primary px-2 py-1 text-xs text-primary-foreground">h2</div>
            <div class="rounded-xs bg-primary px-2 py-1 text-xs text-primary-foreground">h3</div>
          </HStack>
          <VStack gap="1">
            <div class="rounded-xs bg-accent px-2 py-1 text-xs text-accent-foreground">v1</div>
            <div class="rounded-xs bg-accent px-2 py-1 text-xs text-accent-foreground">v2</div>
          </VStack>
        </div>
      </Demo>

      <Demo name="Grid" note="columns 1..12 × gap">
        <Matrix
          row-axis="columns"
          :rows="['1', '2', '3', '4', '6', '12']"
        >
          <template #default="{ row }">
            <Grid :columns="row as never" gap="1">
              <div v-for="n in 12" :key="n" class="h-3 rounded-xs bg-primary/60" />
            </Grid>
          </template>
        </Matrix>
      </Demo>

      <!-- Needs the full row: every step is a max-width between 640px and 1536px, so in a
           320px track all six clamp to `w-full` and render as six identical bars — which is
           what "Container shows nothing" was. Full-width, the first four steps separate. -->
      <Demo name="Container" note="size scale — max-width steps, centred by mx-auto" is-wide>
        <div class="space-y-1">
          <Container
            v-for="s in ['sm', 'md', 'lg', 'xl', '2xl', 'full']"
            :key="s"
            :size="s as never"
            class="bg-muted py-0.5 text-center"
          >
            <span class="font-mono text-[10px]">{{ s }} — {{ CONTAINER_MAX[s] }}</span>
          </Container>
        </div>
        <p class="mt-2 text-[10px] text-subtle-foreground">
          Steps wider than the viewport collapse to `w-full` — expected, `max-width` is a cap.
        </p>
      </Demo>

      <!-- `Flex` declares ONE prop (`as`). It is a bare `display:flex` box, so the demo has to
           prove the two things it actually does: fall through utility classes via `cn`, and
           re-tag through `as`. Two chips proved neither. -->
      <Demo name="Flex" note="bare flex box — utilities fall through cn(), `as` re-tags">
        <div class="space-y-2">
          <div v-for="f in FLEX_CASES" :key="f.label">
            <p class="mb-0.5 font-mono text-[10px] text-subtle-foreground">{{ f.label }}</p>
            <Flex :class="cn('h-10 rounded-xs bg-muted p-1', f.class)">
              <div class="rounded-xs bg-info px-2 py-1 text-xs text-info-foreground">a</div>
              <div class="rounded-xs bg-info px-2 py-1 text-xs text-info-foreground">b</div>
              <div class="rounded-xs bg-info px-2 py-1 text-xs text-info-foreground">c</div>
            </Flex>
          </div>
          <Flex as="ul" class="gap-2 rounded-xs bg-muted p-1">
            <li class="text-xs">as="ul" → renders &lt;ul&gt;</li>
          </Flex>
        </div>
      </Demo>

      <Demo name="AspectRatio" note="1 / 16:9 / 4:3">
        <div class="grid grid-cols-3 gap-2">
          <AspectRatio v-for="r in [1, 16 / 9, 4 / 3]" :key="r" :ratio="r" class="bg-muted">
            <div class="flex size-full items-center justify-center text-[10px]">
              {{ r.toFixed(2) }}
            </div>
          </AspectRatio>
        </div>
      </Demo>

      <Demo name="Center">
        <Center class="h-20 rounded-md bg-muted">
          <span class="text-xs">centered</span>
        </Center>
      </Demo>

      <Demo name="Spacer" note="pushes siblings apart inside a flex row">
        <div class="flex items-center rounded-md bg-muted px-2 py-1">
          <span class="text-xs">left</span>
          <Spacer />
          <span class="text-xs">right</span>
        </div>
      </Demo>

      <!-- `DividerProps` is a UNION: either `orientation` (plain rule) or `label`
           (labelled rule) — `<Divider />` with neither does not typecheck. -->
      <Demo name="Divider" note="plain (orientation) vs labelled (label) branch">
        <div class="space-y-2">
          <Divider orientation="horizontal" />
          <Divider label="or" />
          <div class="flex h-8 items-center gap-2">
            <span class="text-xs">a</span>
            <Divider orientation="vertical" />
            <span class="text-xs">b</span>
          </div>
        </div>
      </Demo>

      <Demo name="ControlGroup" note="horizontal + vertical, divided">
        <div class="space-y-2">
          <ControlGroup label="Horizontal">
            <button class="bg-card px-2 py-1 text-xs">one</button>
            <button class="bg-card px-2 py-1 text-xs">two</button>
          </ControlGroup>
          <ControlGroup orientation="vertical" label="Vertical">
            <button class="bg-card px-2 py-1 text-xs">one</button>
            <button class="bg-card px-2 py-1 text-xs">two</button>
          </ControlGroup>
        </div>
      </Demo>

      <!-- `ScrollArea` is the NATIVE-scrollbar atom (custom track + thumb is the deferred L5
           organism), so the scrollbar paints inside the element's own border box. Putting the
           border + rounding on the scroller therefore drew the bar across the rounded corners
           and read as overflow. The border belongs on a wrapper; the scroller sits inside it. -->
      <Demo name="ScrollArea" note="vertical — native scrollbar, border on the wrapper">
        <div class="overflow-hidden rounded-md border border-border">
          <ScrollArea class="h-24">
            <div class="space-y-1 p-2">
              <p v-for="n in 20" :key="n" class="text-xs">scroll line {{ n }}</p>
            </div>
          </ScrollArea>
        </div>
        <p class="mt-2 text-[10px] text-subtle-foreground">
          axis="horizontal" and "both" below share the same wrapper rule.
        </p>
        <div class="mt-1 overflow-hidden rounded-md border border-border">
          <ScrollArea axis="horizontal" class="w-full">
            <div class="flex w-max gap-2 p-2">
              <span v-for="n in 14" :key="n" class="whitespace-nowrap rounded-xs bg-muted px-2 py-1 text-xs">
                col {{ n }}
              </span>
            </div>
          </ScrollArea>
        </div>
      </Demo>

      <Demo name="Inline" note="align variants, wrapping">
        <Inline gap="2">
          <span v-for="n in 12" :key="n" class="rounded-xs bg-muted px-1.5 py-0.5 text-xs">
            chip {{ n }}
          </span>
        </Inline>
      </Demo>

      <!-- `Cluster` has two axes (gap × justify) and the old demo exercised neither — two
           centred chips look the same under every combination. -->
      <Demo name="Cluster" note="gap × justify — centres by default, unlike Inline" is-wide>
        <Matrix
          row-axis="justify"
          col-axis="gap"
          :rows="['start', 'center', 'end']"
          :cols="['2', '3', '4', '6', '8']"
        >
          <template #default="{ row, col }">
            <Cluster :gap="col as never" :justify="row as never" class="w-40 bg-muted/40 py-1">
              <span class="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] text-primary-soft-foreground">
                one
              </span>
              <span class="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] text-primary-soft-foreground">
                two
              </span>
            </Cluster>
          </template>
        </Matrix>
      </Demo>

      <Demo name="Frame" note="surface card / muted / transparent">
        <div class="space-y-2">
          <Frame v-for="s in ['card', 'muted', 'transparent']" :key="s" :surface="s as never">
            <span class="text-xs">{{ s }}</span>
          </Frame>
        </div>
      </Demo>

      <Demo name="Box" note="polymorphic `as`">
        <Box as="section" class="rounded-md bg-muted p-2 text-xs">renders as &lt;section&gt;</Box>
      </Demo>

      <Demo name="Section" note="py scale">
        <Section py="sm" class="bg-muted">
          <span class="text-xs">section body</span>
        </Section>
      </Demo>

      <Demo name="TwoColumn">
        <TwoColumn gap="4">
          <template #aside>
            <div class="rounded-md bg-muted p-2 text-xs">aside</div>
          </template>
          <div class="rounded-md bg-card p-2 text-xs">main</div>
        </TwoColumn>
      </Demo>

      <Demo name="Navbar" note="start / center / end slots">
        <Navbar>
          <template #start><span class="text-xs font-semibold">brand</span></template>
          <template #center><span class="text-xs">search</span></template>
          <template #end><span class="text-xs">avatar</span></template>
        </Navbar>
      </Demo>

      <Demo name="ResizablePanels" note="drag the separator">
        <ResizablePanels class="h-24 rounded-md border border-border">
          <ResizablePanel :default-size="40">
            <div class="size-full bg-muted p-2 text-xs">left</div>
          </ResizablePanel>
          <ResizableSeparator />
          <ResizablePanel :default-size="60">
            <div class="size-full bg-card p-2 text-xs">right</div>
          </ResizablePanel>
        </ResizablePanels>
      </Demo>

      <Demo name="Overlay" note="position axis, always-visible">
        <div class="relative h-24 rounded-md bg-muted">
          <Overlay
            v-for="p in ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']"
            :key="p"
            :position="p as never"
            :as-child="false"
          >
            <span class="rounded-xs bg-inverse px-1 text-[10px] text-inverse-foreground">
              {{ p }}
            </span>
          </Overlay>
        </div>
      </Demo>
    </div>

    <h3 class="border-t border-border pt-4 font-mono text-xs uppercase text-subtle-foreground">
      auto-mounted tail
    </h3>
    <AutoGroup :namespace="layout" :covered="covered" />
  </div>
</template>
