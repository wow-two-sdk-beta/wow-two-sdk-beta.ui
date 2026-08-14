<script setup lang="ts">
import * as display from '@wow-two-beta/ui-vue/presentation/display';
import { Button } from '@wow-two-beta/ui-vue/presentation/actions';
import { Inbox } from 'lucide-vue-next';
import Demo from '../gallery/Demo.vue';
import Matrix from '../gallery/Matrix.vue';
import AutoGroup from '../gallery/AutoGroup.vue';

const {
  Badge,
  CountBadge,
  Tag,
  Avatar,
  AvatarGroup,
  Text,
  Heading,
  Eyebrow,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  Stat,
  Status,
  MetricChip,
  Kbd,
  KeyboardShortcut,
  Code,
  Snippet,
  Mark,
  Highlight,
  Quote,
  List,
  ListItem,
  Table,
  TableCaption,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  DataTable,
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Separator,
  EmptyState,
  Sparkline,
  Timeline,
  TimelineItem,
  TimelineTitle,
  TimelineDescription,
  DescriptionList,
  InfoRow,
  SectionHeader,
  NotificationDot,
  BadgeOverlay,
  Marquee,
  GradientText,
  Typewriter,
  CountUp,
  AnimatedNumber,
  Tree,
  TreeItem,
  TreeGroup,
  Carousel,
  CarouselViewport,
  CarouselSlides,
  CarouselSlide,
  CarouselPrev,
  CarouselNext,
  CarouselDots,
  ActivityFeed,
  ActivityItem,
  Tooltip,
} = display;

const covered = [
  'Badge',
  'CountBadge',
  'Tag',
  'Avatar',
  'AvatarGroup',
  'Text',
  'Heading',
  'Eyebrow',
  'Card',
  'CardHeader',
  'CardTitle',
  'CardDescription',
  'CardBody',
  'CardFooter',
  'Stat',
  'Status',
  'MetricChip',
  'Kbd',
  'KeyboardShortcut',
  'Code',
  'Snippet',
  'Mark',
  'Highlight',
  'Quote',
  'List',
  'ListItem',
  'Table',
  'TableCaption',
  'TableHead',
  'TableHeaderCell',
  'TableBody',
  'TableRow',
  'TableCell',
  'TableFooter',
  'DataTable',
  'Tabs',
  'TabsList',
  'TabsTab',
  'TabsPanel',
  'Accordion',
  'AccordionItem',
  'AccordionTrigger',
  'AccordionContent',
  'Collapsible',
  'CollapsibleTrigger',
  'CollapsibleContent',
  'Separator',
  'EmptyState',
  'Sparkline',
  'Timeline',
  'TimelineItem',
  'TimelineTitle',
  'TimelineDescription',
  'DescriptionList',
  'InfoRow',
  'SectionHeader',
  'NotificationDot',
  'BadgeOverlay',
  'Marquee',
  'GradientText',
  'Typewriter',
  'CountUp',
  'AnimatedNumber',
  'Tree',
  'TreeItem',
  'TreeGroup',
  'Carousel',
  'CarouselViewport',
  'CarouselSlides',
  'CarouselSlide',
  'CarouselPrev',
  'CarouselNext',
  'CarouselDots',
  'ActivityFeed',
  'ActivityItem',
  'Tooltip',
];

const BADGE_VARIANTS = [
  'neutral',
  'brand',
  'success',
  'warning',
  'danger',
  'info',
  'outline',
] as const;
const TEXT_COLORS = [
  'default',
  'muted',
  'subtle',
  'brand',
  'success',
  'warning',
  'danger',
  'info',
] as const;
const AVATAR_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const AVATAR_TONES = ['none', 'neutral', 'primary', 'danger', 'success', 'warning'] as const;

const SPARK = [4, 9, 3, 12, 8, 15, 6, 18, 11, 20];

const ROWS = [
  { name: 'Ada Lovelace', role: 'Engineer', commits: 128 },
  { name: 'Grace Hopper', role: 'Admiral', commits: 941 },
  { name: 'Alan Turing', role: 'Cryptanalyst', commits: 77 },
];
</script>

<template>
  <div class="space-y-6">
    <h2 class="font-mono text-sm font-bold uppercase tracking-wide">display</h2>

    <Demo name="Badge" note="variant × size">
      <Matrix
        row-axis="variant"
        col-axis="size"
        :rows="BADGE_VARIANTS"
        :cols="['sm', 'md', 'lg']"
      >
        <template #default="{ row, col }">
          <Badge :variant="row as never" :size="col as never">badge</Badge>
        </template>
      </Matrix>
    </Demo>

    <Demo name="Avatar" note="size × tone — fallback initials, no src">
      <Matrix row-axis="size" col-axis="tone" :rows="AVATAR_SIZES" :cols="AVATAR_TONES">
        <template #default="{ row, col }">
          <Avatar :size="row as never" :tone="col as never" name="Ada Lovelace" />
        </template>
      </Matrix>
    </Demo>

    <Demo name="Text" note="size × color">
      <Matrix
        row-axis="size"
        col-axis="color"
        :rows="['xs', 'sm', 'md', 'lg', 'xl']"
        :cols="TEXT_COLORS"
      >
        <template #default="{ row, col }">
          <Text :size="row as never" :color="col as never">Sample</Text>
        </template>
      </Matrix>
    </Demo>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-3">
      <Demo name="Tag" note="variant axis + closable">
        <div class="flex flex-wrap gap-2">
          <Tag v-for="v in ['neutral', 'brand', 'success', 'warning', 'danger', 'info']" :key="v" :variant="v as never">
            {{ v }}
          </Tag>
          <Tag variant="brand" @close="() => {}">closable</Tag>
        </div>
      </Demo>

      <Demo name="Avatar" note="shape / ring / bgStyle / loading / image src">
        <div class="flex flex-wrap items-center gap-2">
          <Avatar name="Ada Lovelace" shape="square" />
          <Avatar name="Grace Hopper" ring="primary" />
          <Avatar name="Alan Turing" bg-style="gradient" />
          <Avatar is-loading />
          <Avatar fallback="42" />
          <Avatar src="https://example.invalid/nope.png" name="Broken Src" />
        </div>
      </Demo>

      <Demo name="AvatarGroup" note="max 3 — overflow becomes a +N chip">
        <AvatarGroup :max="3">
          <Avatar name="Ada Lovelace" />
          <Avatar name="Grace Hopper" />
          <Avatar name="Alan Turing" />
          <Avatar name="Katherine Johnson" />
          <Avatar name="Margaret Hamilton" />
        </AvatarGroup>
      </Demo>

      <!-- `canHideZero` defaults to TRUE, so a zero count renders nothing at all
           unless it is explicitly switched off. -->
      <Demo name="CountBadge" note="max clamp → 99+; zero hidden by default">
        <div class="flex items-center gap-3">
          <CountBadge :value="3" />
          <CountBadge :value="128" :max="99" />
          <span class="text-[10px] text-subtle-foreground">0 (default):</span>
          <CountBadge :value="0" />
          <span class="text-[10px] text-subtle-foreground">0 (:can-hide-zero="false"):</span>
          <CountBadge :value="0" :can-hide-zero="false" />
          <CountBadge :value="7" variant="brand" />
          <CountBadge :value="7" variant="outline" />
        </div>
      </Demo>

      <Demo name="Heading" note="size × weight">
        <Matrix
          row-axis="size"
          col-axis="weight"
          :rows="['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']"
          :cols="['normal', 'medium', 'semibold', 'bold']"
        >
          <template #default="{ row, col }">
            <Heading :size="row as never" :weight="col as never">Aa</Heading>
          </template>
        </Matrix>
      </Demo>

      <Demo name="Eyebrow / SectionHeader">
        <div class="space-y-3">
          <Eyebrow v-for="t in ['muted', 'subtle', 'default']" :key="t" :tone="t as never">
            {{ t }} eyebrow
          </Eyebrow>
          <SectionHeader title="Section header" description="With a supporting line" />
        </div>
      </Demo>

      <Demo name="Card" note="compound parts on a Surface variant">
        <Card variant="elevated" padding="md" radius="lg">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Supporting description line.</CardDescription>
          </CardHeader>
          <CardBody><p class="text-sm">Body content.</p></CardBody>
          <CardFooter><Button size="sm" variant="soft">Action</Button></CardFooter>
        </Card>
      </Demo>

      <Demo name="Stat" note="size axis + trend">
        <div class="flex flex-wrap gap-4">
          <Stat v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s as never" label="MRR" value="$12.4k" helper="vs last month" />
        </div>
      </Demo>

      <Demo name="Status" note="tone × size, pulse">
        <Matrix
          row-axis="tone"
          col-axis="size"
          :rows="['success', 'warning', 'destructive', 'info', 'neutral']"
          :cols="['xs', 'sm', 'md']"
        >
          <template #default="{ row, col }">
            <Status :tone="row as never" :size="col as never">{{ row }}</Status>
          </template>
        </Matrix>
      </Demo>

      <Demo name="MetricChip" note="tone × size">
        <Matrix
          row-axis="tone"
          col-axis="size"
          :rows="['neutral', 'success', 'warning', 'danger', 'info']"
          :cols="['xs', 'sm', 'md']"
        >
          <template #default="{ row, col }">
            <MetricChip label="p95" value="182ms" :tone="row as never" :size="col as never" />
          </template>
        </Matrix>
      </Demo>

      <Demo name="Kbd / KeyboardShortcut">
        <div class="flex flex-wrap items-center gap-3">
          <Kbd>⌘</Kbd>
          <Kbd>Shift</Kbd>
          <KeyboardShortcut :keys="['Meta', 'K']" />
          <KeyboardShortcut :keys="['Ctrl', 'Shift', 'P']" separator="+" />
        </div>
      </Demo>

      <Demo name="Code / Snippet">
        <div class="space-y-2">
          <p class="text-sm">Inline <Code>pnpm build</Code> in a sentence.</p>
          <Code variant="block">const x = 1;\nconst y = 2;</Code>
          <Snippet text="pnpm add @wow-two-beta/ui-vue" />
          <Snippet variant="block" text="pnpm --filter playground dev" />
        </div>
      </Demo>

      <Demo name="Mark / Highlight / Quote">
        <div class="space-y-2 text-sm">
          <p>A sentence with a <Mark>marked</Mark> word.</p>
          <p><Highlight text="the quick brown fox jumps" query="brown" /></p>
          <Quote>Everything should be made as simple as possible, but no simpler.</Quote>
        </div>
      </Demo>

      <Demo name="List" note="marker × spacing">
        <Matrix
          row-axis="marker"
          col-axis="spacing"
          :rows="['none', 'disc', 'decimal', 'check']"
          :cols="['tight', 'normal', 'loose']"
        >
          <template #default="{ row, col }">
            <List :marker="row as never" :spacing="col as never">
              <ListItem>one</ListItem>
              <ListItem>two</ListItem>
            </List>
          </template>
        </Matrix>
      </Demo>

      <Demo name="Table" note="density axis, striped + hoverable">
        <div class="space-y-3">
          <Table
            v-for="d in ['compact', 'cozy', 'comfortable', 'roomy']"
            :key="d"
            :density="d as never"
            is-striped
            is-hoverable
          >
            <TableCaption>density = {{ d }}</TableCaption>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow v-for="r in ROWS" :key="r.name">
                <TableCell>{{ r.name }}</TableCell>
                <TableCell>{{ r.role }}</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow><TableCell>3 rows</TableCell><TableCell /></TableRow>
            </TableFooter>
          </Table>
        </div>
      </Demo>

      <Demo name="DataTable" note="sortable columns — click a header">
        <DataTable
          :columns="[
            { key: 'name', header: 'Name', isSortable: true },
            { key: 'role', header: 'Role' },
            { key: 'commits', header: 'Commits', align: 'right', isSortable: true },
          ]"
          :data="ROWS"
          is-striped
          is-hoverable
        />
      </Demo>

      <Demo name="Tabs" note="horizontal + vertical, click to switch">
        <div class="space-y-4">
          <Tabs default-value="a">
            <TabsList>
              <TabsTab value="a">Overview</TabsTab>
              <TabsTab value="b">Settings</TabsTab>
              <TabsTab value="c" is-disabled>Disabled</TabsTab>
            </TabsList>
            <TabsPanel value="a"><p class="p-2 text-sm">Overview panel</p></TabsPanel>
            <TabsPanel value="b"><p class="p-2 text-sm">Settings panel</p></TabsPanel>
          </Tabs>
          <Tabs default-value="a" orientation="vertical">
            <TabsList>
              <TabsTab value="a">One</TabsTab>
              <TabsTab value="b">Two</TabsTab>
            </TabsList>
            <TabsPanel value="a"><p class="p-2 text-sm">Panel one</p></TabsPanel>
            <TabsPanel value="b"><p class="p-2 text-sm">Panel two</p></TabsPanel>
          </Tabs>
        </div>
      </Demo>

      <Demo name="Accordion" note="single collapsible — click a trigger">
        <Accordion type="single" default-value="a" is-collapsible>
          <AccordionItem value="a">
            <AccordionTrigger>First section</AccordionTrigger>
            <AccordionContent><p class="text-sm">First body.</p></AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Second section</AccordionTrigger>
            <AccordionContent><p class="text-sm">Second body.</p></AccordionContent>
          </AccordionItem>
        </Accordion>
      </Demo>

      <Demo name="Collapsible">
        <Collapsible default-open>
          <CollapsibleTrigger>Toggle content</CollapsibleTrigger>
          <CollapsibleContent><p class="p-2 text-sm">Collapsible body.</p></CollapsibleContent>
        </Collapsible>
      </Demo>

      <Demo name="Separator">
        <div class="space-y-2">
          <Separator />
          <div class="flex h-6 items-center gap-2 text-xs">
            a <Separator orientation="vertical" /> b
          </div>
        </div>
      </Demo>

      <Demo name="EmptyState" note="size axis">
        <EmptyState title="No messages" description="Your inbox is empty." size="sm">
          <template #icon><Inbox :size="24" /></template>
        </EmptyState>
      </Demo>

      <Demo name="Sparkline" note="variant × tone">
        <Matrix
          row-axis="variant"
          col-axis="tone"
          :rows="['line', 'area', 'bar', 'dot']"
          :cols="['brand', 'success', 'warning', 'danger', 'muted']"
        >
          <template #default="{ row, col }">
            <Sparkline :data="SPARK" :variant="row as never" :tone="col as never" :width="60" :height="20" />
          </template>
        </Matrix>
      </Demo>

      <Demo name="Timeline" note="status axis on the item markers">
        <Timeline>
          <TimelineItem v-for="s in ['default', 'primary', 'success', 'warning', 'destructive', 'info']" :key="s" :status="s as never">
            <TimelineTitle>{{ s }} event</TimelineTitle>
            <TimelineDescription>Happened at 10:0{{ s.length }}</TimelineDescription>
          </TimelineItem>
        </Timeline>
      </Demo>

      <Demo name="DescriptionList" note="layout × density">
        <div class="space-y-3">
          <DescriptionList
            v-for="l in ['inline', 'stacked']"
            :key="l"
            :layout="l as never"
            :items="[
              { label: 'Version', value: '0.0.4' },
              { label: 'License', value: 'MIT' },
            ]"
          />
        </div>
      </Demo>

      <Demo name="InfoRow" note="inline + stacked">
        <div class="space-y-2">
          <InfoRow label="Status" value="Active" />
          <InfoRow label="Region" value="eu-central-1" layout="stacked" />
        </div>
      </Demo>

      <Demo name="NotificationDot / BadgeOverlay" note="corner positions">
        <div class="flex flex-wrap items-center gap-6">
          <BadgeOverlay v-for="p in ['top-right', 'top-left', 'bottom-right', 'bottom-left']" :key="p" :position="p as never">
            <Avatar name="Ada Lovelace" />
            <template #badge><NotificationDot tone="destructive" /></template>
          </BadgeOverlay>
          <NotificationDot v-for="t in ['destructive', 'success', 'warning', 'info', 'primary', 'neutral']" :key="t" :tone="t as never" />
          <NotificationDot tone="destructive" has-pulse />
        </div>
      </Demo>

      <Demo name="GradientText / Typewriter" note="animated text">
        <div class="space-y-2 text-lg font-semibold">
          <GradientText from="var(--color-primary)" to="var(--color-accent)">
            Gradient heading
          </GradientText>
          <div><Typewriter :text="['ported to Vue', 'still unlooked-at']" /></div>
        </div>
      </Demo>

      <Demo name="CountUp / AnimatedNumber" note="should tick up on mount">
        <div class="flex items-center gap-6 text-2xl font-semibold tabular-nums">
          <CountUp :to="1284" />
          <AnimatedNumber :value="42" />
        </div>
      </Demo>

      <Demo name="Marquee" note="direction axis — content should scroll">
        <Marquee class="rounded-md bg-muted py-1">
          <span class="px-4 text-xs">scrolling marquee content · </span>
          <span class="px-4 text-xs">second item · </span>
        </Marquee>
      </Demo>

      <Demo name="Tree" note="expand / collapse a group">
        <Tree :default-expanded="['src']">
          <TreeGroup value="src" label="src">
            <TreeItem value="index">index.ts</TreeItem>
            <TreeItem value="app">App.vue</TreeItem>
          </TreeGroup>
          <TreeItem value="readme">README.md</TreeItem>
        </Tree>
      </Demo>

      <Demo name="Carousel" note="prev / next / dots">
        <Carousel :slides-count="3">
          <CarouselViewport>
            <CarouselSlides>
              <CarouselSlide v-for="n in 3" :key="n">
                <div class="grid h-20 place-items-center rounded-md bg-muted text-sm">
                  slide {{ n }}
                </div>
              </CarouselSlide>
            </CarouselSlides>
          </CarouselViewport>
          <div class="mt-2 flex items-center justify-between">
            <CarouselPrev />
            <CarouselDots />
            <CarouselNext />
          </div>
        </Carousel>
      </Demo>

      <Demo name="ActivityFeed">
        <ActivityFeed>
          <ActivityItem title="Pushed 3 commits" timestamp="2h ago" />
          <ActivityItem title="Opened a PR" timestamp="4h ago" />
          <ActivityItem title="Closed an issue" timestamp="1d ago" />
        </ActivityFeed>
      </Demo>

      <Demo name="Tooltip" note="hover the target">
        <Tooltip content="A tooltip, positioned by floating-ui">
          <Button variant="outline" size="sm">Hover me</Button>
        </Tooltip>
      </Demo>
    </div>

    <h3 class="border-t border-border pt-4 font-mono text-xs uppercase text-subtle-foreground">
      auto-mounted tail
    </h3>
    <AutoGroup :namespace="display" :covered="covered" />
  </div>
</template>
