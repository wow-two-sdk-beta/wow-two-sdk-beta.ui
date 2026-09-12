<script setup lang="ts">
import * as sweepLayout from '@wow-two-beta/ui-vue/presentation/layout';
import * as sweepOverlays from '@wow-two-beta/ui-vue/presentation/overlays';
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
  EyebrowText,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  StatCard,
  Status,
  MetricBadge,
  KbdText,
  KeyboardShortcutText,
  CodeText,
  SnippetText,
  MarkText,
  HighlightText,
  QuoteText,
  ListGroup,
  ListGroupItem,
  Table,
  TableCaption,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  DataTable,
  TabsGroup,
  TabsGroupList,
  TabsGroupTab,
  TabsGroupPanel,
  AccordionGroup,
  AccordionGroupItem,
  AccordionGroupTrigger,
  AccordionGroupContent,
  CollapsibleGroup,
  CollapsibleGroupTrigger,
  CollapsibleGroupContent,
  SeparatorLayout,
  EmptyState,
  Sparkline,
  Timeline,
  TimelineItem,
  TimelineTitle,
  TimelineDescription,
  DescriptionGroup,
  InfoRow,
  SectionHeading,
  NotificationIndicator,
  BadgeOverlay,
  MarqueeGroup,
  GradientText,
  TypewriterText,
  CountUpText,
  AnimatedNumberText,
  TreeViewer,
  TreeViewerItem,
  TreeViewerGroup,
  Carousel,
  CarouselViewport,
  CarouselSlides,
  CarouselSlide,
  CarouselPrev,
  CarouselNext,
  CarouselDots,
  ActivityTimeline,
  ActivityItem,
  Tooltip,
} = { ...display, ...sweepLayout, ...sweepOverlays };

const covered = [
  'Badge',
  'CountBadge',
  'Tag',
  'Avatar',
  'AvatarGroup',
  'Text',
  'Heading',
  'EyebrowText',
  'Card',
  'CardHeader',
  'CardTitle',
  'CardDescription',
  'CardBody',
  'CardFooter',
  'StatCard',
  'Status',
  'MetricBadge',
  'KbdText',
  'KeyboardShortcutText',
  'CodeText',
  'SnippetText',
  'MarkText',
  'HighlightText',
  'QuoteText',
  'ListGroup',
  'ListGroupItem',
  'Table',
  'TableCaption',
  'TableHead',
  'TableHeaderCell',
  'TableBody',
  'TableRow',
  'TableCell',
  'TableFooter',
  'DataTable',
  'TabsGroup',
  'TabsGroupList',
  'TabsGroupTab',
  'TabsGroupPanel',
  'AccordionGroup',
  'AccordionGroupItem',
  'AccordionGroupTrigger',
  'AccordionGroupContent',
  'CollapsibleGroup',
  'CollapsibleGroupTrigger',
  'CollapsibleGroupContent',
  'SeparatorLayout',
  'EmptyState',
  'Sparkline',
  'Timeline',
  'TimelineItem',
  'TimelineTitle',
  'TimelineDescription',
  'DescriptionGroup',
  'InfoRow',
  'SectionHeading',
  'NotificationIndicator',
  'BadgeOverlay',
  'MarqueeGroup',
  'GradientText',
  'TypewriterText',
  'CountUpText',
  'AnimatedNumberText',
  'TreeViewer',
  'TreeViewerItem',
  'TreeViewerGroup',
  'Carousel',
  'CarouselViewport',
  'CarouselSlides',
  'CarouselSlide',
  'CarouselPrev',
  'CarouselNext',
  'CarouselDots',
  'ActivityTimeline',
  'ActivityItem',
  'Tooltip',
];

const BADGE_VARIANTS = ['neutral', 'brand', 'success', 'warning', 'danger', 'info', 'outline'] as const;
const TEXT_COLORS = ['default', 'muted', 'subtle', 'brand', 'success', 'warning', 'danger', 'info'] as const;
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
      <Matrix row-axis="variant" col-axis="size" :rows="BADGE_VARIANTS" :cols="['sm', 'md', 'lg']">
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
      <Matrix row-axis="size" col-axis="color" :rows="['xs', 'sm', 'md', 'lg', 'xl']" :cols="TEXT_COLORS">
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

      <!-- 8 × 4. Squeezed into a 330px track it grew an inner horizontal scrollbar,
           which defeats the point of a matrix — the axes stop being comparable. -->
      <Demo name="Heading" note="size × weight" is-wide>
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

      <Demo name="EyebrowText / SectionHeading">
        <div class="space-y-3">
          <EyebrowText v-for="t in ['muted', 'subtle', 'default']" :key="t" :tone="t as never">
            {{ t }} eyebrow
          </EyebrowText>
          <SectionHeading title="Section header" description="With a supporting line" />
        </div>
      </Demo>

      <Demo name="Card" note="compound parts on a SurfaceLayout variant">
        <Card variant="elevated" padding="md" radius="lg">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Supporting description line.</CardDescription>
          </CardHeader>
          <CardBody><p class="text-sm">Body content.</p></CardBody>
          <CardFooter><Button size="sm" variant="soft">Action</Button></CardFooter>
        </Card>
      </Demo>

      <Demo name="StatCard" note="size axis + trend">
        <div class="flex flex-wrap gap-4">
          <StatCard
            v-for="s in ['sm', 'md', 'lg']"
            :key="s"
            :size="s as never"
            label="MRR"
            value="$12.4k"
            helper="vs last month"
          />
        </div>
      </Demo>

      <Demo name="Status" note="tone × size, pulse" is-wide>
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

      <Demo name="MetricBadge" note="tone × size">
        <Matrix
          row-axis="tone"
          col-axis="size"
          :rows="['neutral', 'success', 'warning', 'danger', 'info']"
          :cols="['xs', 'sm', 'md']"
        >
          <template #default="{ row, col }">
            <MetricBadge label="p95" value="182ms" :tone="row as never" :size="col as never" />
          </template>
        </Matrix>
      </Demo>

      <Demo name="KbdText / KeyboardShortcutText">
        <div class="flex flex-wrap items-center gap-3">
          <KbdText>⌘</KbdText>
          <KbdText>Shift</KbdText>
          <KeyboardShortcutText :keys="['Meta', 'K']" />
          <KeyboardShortcutText :keys="['Ctrl', 'Shift', 'P']" separator="+" />
        </div>
      </Demo>

      <Demo name="CodeText / SnippetText">
        <div class="space-y-2">
          <p class="text-sm">InlineLayout <CodeText>pnpm build</CodeText> in a sentence.</p>
          <CodeText variant="block">const x = 1;\nconst y = 2;</CodeText>
          <SnippetText text="pnpm add @wow-two-beta/ui-vue" />
          <SnippetText variant="block" text="pnpm --filter playground dev" />
        </div>
      </Demo>

      <Demo name="MarkText / HighlightText / QuoteText">
        <div class="space-y-2 text-sm">
          <p>A sentence with a <MarkText>marked</MarkText> word.</p>
          <p><HighlightText text="the quick brown fox jumps" query="brown" /></p>
          <QuoteText>Everything should be made as simple as possible, but no simpler.</QuoteText>
        </div>
      </Demo>

      <Demo name="ListGroup" note="marker × spacing">
        <Matrix
          row-axis="marker"
          col-axis="spacing"
          :rows="['none', 'disc', 'decimal', 'check']"
          :cols="['tight', 'normal', 'loose']"
        >
          <template #default="{ row, col }">
            <ListGroup :marker="row as never" :spacing="col as never">
              <ListGroupItem>one</ListGroupItem>
              <ListGroupItem>two</ListGroupItem>
            </ListGroup>
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

      <Demo name="TabsGroup" note="horizontal + vertical, click to switch">
        <div class="space-y-4">
          <TabsGroup default-value="a">
            <TabsGroupList>
              <TabsGroupTab value="a">Overview</TabsGroupTab>
              <TabsGroupTab value="b">Settings</TabsGroupTab>
              <TabsGroupTab value="c" is-disabled>Disabled</TabsGroupTab>
            </TabsGroupList>
            <TabsGroupPanel value="a"><p class="p-2 text-sm">Overview panel</p></TabsGroupPanel>
            <TabsGroupPanel value="b"><p class="p-2 text-sm">Settings panel</p></TabsGroupPanel>
          </TabsGroup>
          <TabsGroup default-value="a" orientation="vertical">
            <TabsGroupList>
              <TabsGroupTab value="a">One</TabsGroupTab>
              <TabsGroupTab value="b">Two</TabsGroupTab>
            </TabsGroupList>
            <TabsGroupPanel value="a"><p class="p-2 text-sm">Panel one</p></TabsGroupPanel>
            <TabsGroupPanel value="b"><p class="p-2 text-sm">Panel two</p></TabsGroupPanel>
          </TabsGroup>
        </div>
      </Demo>

      <Demo name="AccordionGroup" note="single collapsible — click a trigger">
        <AccordionGroup type="single" default-value="a" is-collapsible>
          <AccordionGroupItem value="a">
            <AccordionGroupTrigger>First section</AccordionGroupTrigger>
            <AccordionGroupContent><p class="text-sm">First body.</p></AccordionGroupContent>
          </AccordionGroupItem>
          <AccordionGroupItem value="b">
            <AccordionGroupTrigger>Second section</AccordionGroupTrigger>
            <AccordionGroupContent><p class="text-sm">Second body.</p></AccordionGroupContent>
          </AccordionGroupItem>
        </AccordionGroup>
      </Demo>

      <Demo name="CollapsibleGroup">
        <CollapsibleGroup default-open>
          <CollapsibleGroupTrigger>Toggle content</CollapsibleGroupTrigger>
          <CollapsibleGroupContent><p class="p-2 text-sm">CollapsibleGroup body.</p></CollapsibleGroupContent>
        </CollapsibleGroup>
      </Demo>

      <Demo name="SeparatorLayout">
        <div class="space-y-2">
          <SeparatorLayout />
          <div class="flex h-6 items-center gap-2 text-xs">a <SeparatorLayout orientation="vertical" /> b</div>
        </div>
      </Demo>

      <Demo name="EmptyState" note="size axis">
        <EmptyState title="No messages" description="Your inbox is empty." size="sm">
          <template #icon><Inbox :size="24" /></template>
        </EmptyState>
      </Demo>

      <Demo name="Sparkline" note="variant × tone" is-wide>
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
          <TimelineItem
            v-for="s in ['default', 'primary', 'success', 'warning', 'destructive', 'info']"
            :key="s"
            :status="s as never"
          >
            <TimelineTitle>{{ s }} event</TimelineTitle>
            <TimelineDescription>Happened at 10:0{{ s.length }}</TimelineDescription>
          </TimelineItem>
        </Timeline>
      </Demo>

      <Demo name="DescriptionGroup" note="layout × density">
        <div class="space-y-3">
          <DescriptionGroup
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

      <Demo name="NotificationIndicator / BadgeOverlay" note="corner positions">
        <div class="flex flex-wrap items-center gap-6">
          <BadgeOverlay
            v-for="p in ['top-right', 'top-left', 'bottom-right', 'bottom-left']"
            :key="p"
            :position="p as never"
          >
            <Avatar name="Ada Lovelace" />
            <template #badge><NotificationIndicator tone="destructive" /></template>
          </BadgeOverlay>
          <NotificationIndicator
            v-for="t in ['destructive', 'success', 'warning', 'info', 'primary', 'neutral']"
            :key="t"
            :tone="t as never"
          />
          <NotificationIndicator tone="destructive" has-pulse />
        </div>
      </Demo>

      <Demo name="GradientText / TypewriterText" note="animated text">
        <div class="space-y-2 text-lg font-semibold">
          <GradientText from="var(--color-primary)" to="var(--color-accent)"> Gradient heading </GradientText>
          <div><TypewriterText :text="['Made with Vue', 'Ready for your ideas']" /></div>
        </div>
      </Demo>

      <Demo name="CountUpText / AnimatedNumberText" note="should tick up on mount">
        <div class="flex items-center gap-6 text-2xl font-semibold tabular-nums">
          <CountUpText :to="1284" />
          <AnimatedNumberText :value="42" />
        </div>
      </Demo>

      <Demo name="MarqueeGroup" note="direction axis — content should scroll">
        <MarqueeGroup class="rounded-md bg-muted py-1">
          <span class="px-4 text-xs">scrolling marquee content · </span>
          <span class="px-4 text-xs">second item · </span>
        </MarqueeGroup>
      </Demo>

      <Demo name="TreeViewer" note="expand / collapse a group">
        <TreeViewer :default-expanded="['src']">
          <TreeViewerGroup value="src" label="src">
            <TreeViewerItem value="index">index.ts</TreeViewerItem>
            <TreeViewerItem value="app">App.vue</TreeViewerItem>
          </TreeViewerGroup>
          <TreeViewerItem value="readme">README.md</TreeViewerItem>
        </TreeViewer>
      </Demo>

      <Demo name="Carousel" note="prev / next / dots">
        <Carousel :slides-count="3">
          <CarouselViewport>
            <CarouselSlides>
              <CarouselSlide v-for="n in 3" :key="n">
                <div class="grid h-20 place-items-center rounded-md bg-muted text-sm">slide {{ n }}</div>
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

      <Demo name="ActivityTimeline">
        <ActivityTimeline>
          <ActivityItem title="Pushed 3 commits" timestamp="2h ago" />
          <ActivityItem title="Opened a PR" timestamp="4h ago" />
          <ActivityItem title="Closed an issue" timestamp="1d ago" />
        </ActivityTimeline>
      </Demo>

      <Demo name="Tooltip" note="hover the target">
        <Tooltip content="A tooltip, positioned by floating-ui">
          <Button variant="outline" size="sm">Hover me</Button>
        </Tooltip>
      </Demo>
    </div>

    <h3 class="border-t border-border pt-4 font-mono text-xs uppercase text-subtle-foreground">auto-mounted tail</h3>
    <AutoGroup :namespace="display" :covered="covered" />
  </div>
</template>
