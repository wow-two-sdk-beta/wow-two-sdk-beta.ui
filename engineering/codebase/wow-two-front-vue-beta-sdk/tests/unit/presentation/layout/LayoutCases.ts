import { h, type VNode } from 'vue';
import { Orientation } from '@src/foundation/utils';
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
  ControlGroup,
  Divider,
  Flex,
  Frame,
  Grid,
  HStack,
  Inline,
  Navbar,
  Overlay,
  PullToRefresh,
  ResizablePanel,
  ResizablePanels,
  ResizableSeparator,
  ScrollArea,
  Section,
  Spacer,
  Stack,
  Surface,
  TwoColumn,
  VStack,
} from '@src/presentation/layout';
import { smokeCase, type SmokeCase } from '../../../support/Smoke';

/* Wrappers for the compound parts — each renders the part inside the root whose `provide` it
   injects, so the part is smoke-tested in the shape it actually ships in. */
const inResizablePanels = (node: VNode): VNode => h(ResizablePanels, null, () => node);
const inAppShell = (node: VNode): VNode => h(AppShell, null, () => node);
const inAppShellMain = (node: VNode): VNode => inAppShell(h(AppShellMain, null, () => node));

/**
 * Every component `@wow-two-beta/ui-vue/presentation/layout` exports, as smoke cases.
 * Imported through the public barrel on purpose — a component missing from `index.ts` fails
 * here before a consumer finds it.
 */
export const layoutCases: readonly SmokeCase[] = [
  smokeCase('Box', Box, {}, { slot: true }),
  smokeCase('Stack', Stack, {}, { slot: true }),
  smokeCase('HStack', HStack, {}, { slot: true }),
  smokeCase('VStack', VStack, {}, { slot: true }),
  smokeCase('Grid', Grid, {}, { slot: true }),
  smokeCase('Container', Container, {}, { slot: true }),
  smokeCase('Flex', Flex, {}, { slot: true }),
  smokeCase('AspectRatio', AspectRatio, {}, { slot: true }),
  smokeCase('Spacer', Spacer, {}),
  smokeCase('Center', Center, {}, { slot: true }),
  smokeCase('Divider', Divider, { orientation: Orientation.Horizontal }),
  smokeCase('ControlGroup', ControlGroup, { label: 'Density' }, { slot: true }),
  smokeCase('ScrollArea', ScrollArea, {}, { slot: true }),
  smokeCase('Inline', Inline, {}, { slot: true }),
  smokeCase('Cluster', Cluster, {}, { slot: true }),
  smokeCase('Frame', Frame, {}, { slot: true }),
  smokeCase('TwoColumn', TwoColumn, {}, { slot: true }),
  smokeCase('ResizablePanel', ResizablePanel, {}, { slot: true, wrap: inResizablePanels }),
  smokeCase('ResizablePanels', ResizablePanels, {}, { slot: true }),
  smokeCase('ResizableSeparator', ResizableSeparator, {}, { wrap: inResizablePanels }),
  smokeCase('PullToRefresh', PullToRefresh, { onRefresh: () => undefined }, { slot: true }),
  smokeCase('AppShell', AppShell, {}, { slot: true }),
  smokeCase('AppShellHeader', AppShellHeader, {}, { slot: true, wrap: inAppShell }),
  smokeCase('AppShellSidebar', AppShellSidebar, {}, { slot: true, wrap: inAppShell }),
  smokeCase('AppShellMain', AppShellMain, {}, { slot: true, wrap: inAppShell }),
  smokeCase('AppShellContent', AppShellContent, {}, { slot: true, wrap: inAppShellMain }),
  // No slot probe: the aside is `v-if`d off `isAsideHidden`, which tracks a media query — with no
  // real viewport it is always hidden. Its rendered form belongs to the `browser` tier.
  smokeCase('AppShellAside', AppShellAside, {}, { wrap: inAppShell }),
  smokeCase('AppShellFooter', AppShellFooter, {}, { slot: true, wrap: inAppShell }),
  smokeCase('Overlay', Overlay, {}, { slot: true }),
  smokeCase('Surface', Surface, {}, { slot: true }),
  smokeCase('Section', Section, {}, { slot: true }),
  smokeCase('Navbar', Navbar, {}, { slot: true }),
];
