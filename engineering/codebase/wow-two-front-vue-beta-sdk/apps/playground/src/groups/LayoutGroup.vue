<script setup lang="ts">
import * as layout from '@wow-two-beta/ui-vue/presentation/layout';
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
      <Demo name="Surface" note="radius × elevation">
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

      <Demo name="Stack" note="direction × gap">
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

      <Demo name="Stack" note="align × justify inside a fixed 120×48 box">
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

      <Demo name="Container" note="size scale — max-width steps">
        <div class="space-y-1">
          <Container
            v-for="s in ['sm', 'md', 'lg', 'xl', '2xl', 'full']"
            :key="s"
            :size="s as never"
            class="bg-muted"
          >
            <span class="text-[10px]">{{ s }}</span>
          </Container>
        </div>
      </Demo>

      <Demo name="Flex">
        <Flex class="gap-2">
          <div class="rounded-xs bg-info px-2 py-1 text-xs text-info-foreground">a</div>
          <div class="rounded-xs bg-info px-2 py-1 text-xs text-info-foreground">b</div>
        </Flex>
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

      <Demo name="ScrollArea" note="vertical — should clip and scroll, not grow">
        <ScrollArea class="h-24 rounded-md border border-border">
          <div class="space-y-1 p-2">
            <p v-for="n in 20" :key="n" class="text-xs">scroll line {{ n }}</p>
          </div>
        </ScrollArea>
      </Demo>

      <Demo name="Inline" note="align variants, wrapping">
        <Inline gap="2">
          <span v-for="n in 12" :key="n" class="rounded-xs bg-muted px-1.5 py-0.5 text-xs">
            chip {{ n }}
          </span>
        </Inline>
      </Demo>

      <Demo name="Cluster">
        <Cluster gap="2">
          <span class="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary-soft-foreground">
            one
          </span>
          <span class="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary-soft-foreground">
            two
          </span>
        </Cluster>
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
