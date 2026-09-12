import { h, type VNode } from 'vue';
import {
  Breadcrumb,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Menu,
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavItem,
  Pagination,
  ScrollSpy,
  TableOfContents,
} from '../../../../../src/presentation/nav';
import {
  CommandPaletteModal,
  CommandPaletteModalContent,
  CommandPaletteModalEmpty,
  CommandPaletteModalGroup,
  CommandPaletteModalInput,
  CommandPaletteModalItem,
  CommandPaletteModalList,
  CommandPaletteModalSeparator,
} from '../../../../../src/presentation/overlays';
import { smokeCase, type SmokeCase } from './Example';

/* Wrappers for the compound parts. Every root is opened through its UNCONTROLLED path
   (`defaultOpen`) rather than by passing `open`, which doubles as the regression guard for
   the port's `boolean` cast bug — a root that lost its explicit `undefined` default reads as
   controlled-and-closed, and every part below it would render nothing. */
const inMenu = (node: VNode): VNode => h(Menu, { anchor: null, open: true }, () => node);

const inDropdownMenu = (node: VNode): VNode => h(DropdownMenu, { defaultOpen: true }, () => node);

/* ContextMenu's props are `Record<string, never>` — the root owns its open state outright and
   only a real pointer gesture on the trigger opens it, so there is no uncontrolled prop to set. */
const inContextMenu = (node: VNode): VNode => h(ContextMenu, null, () => node);

const inMenubar = (node: VNode): VNode => h(Menubar, { defaultValue: 'file' }, () => node);
const inMenubarMenu = (node: VNode): VNode => inMenubar(h(MenubarMenu, { value: 'file' }, () => node));

const inNavigationMenu = (node: VNode): VNode => h(NavigationMenu, { defaultValue: 'products' }, () => node);
const inNavigationMenuList = (node: VNode): VNode => inNavigationMenu(h(NavigationMenuList, null, () => node));
const inNavigationMenuItem = (node: VNode): VNode =>
  inNavigationMenuList(h(NavigationMenuItem, { value: 'products' }, () => node));

const inCommandPalette = (node: VNode): VNode => h(CommandPaletteModal, { defaultOpen: true }, () => node);
const inCommandPaletteContent = (node: VNode): VNode =>
  inCommandPalette(h(CommandPaletteModalContent, null, () => node));
const inCommandPaletteList = (node: VNode): VNode =>
  inCommandPaletteContent(h(CommandPaletteModalList, null, () => node));

/**
 * Every component `@wow-two-beta/ui-vue/presentation/nav` exports, as smoke cases.
 * Imported through the public barrel on purpose — a component missing from `index.ts` fails
 * here before a consumer finds it.
 */
export const navExamples: readonly SmokeCase[] = [
  smokeCase('Breadcrumb', Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: 'Settings' }] }),
  smokeCase('Pagination', Pagination, { total: 100, page: 1 }),
  smokeCase('NavItem', NavItem, {}, { slot: true }),
  smokeCase('Menu', Menu, { anchor: null, open: true }, { slot: true }),
  smokeCase('MenuItem', MenuItem, {}, { slot: true, wrap: inMenu }),
  smokeCase('MenuGroup', MenuGroup, {}, { slot: true, wrap: inMenu }),
  smokeCase('MenuLabel', MenuLabel, {}, { slot: true, wrap: inMenu }),
  smokeCase('MenuSeparator', MenuSeparator, {}, { wrap: inMenu }),
  smokeCase('DropdownMenu', DropdownMenu, {}, { slot: true }),
  smokeCase('DropdownMenuTrigger', DropdownMenuTrigger, {}, { slot: true, wrap: inDropdownMenu }),
  smokeCase('DropdownMenuContent', DropdownMenuContent, {}, { slot: true, wrap: inDropdownMenu }),
  smokeCase('ContextMenu', ContextMenu, {}, { slot: true }),
  smokeCase('ContextMenuTrigger', ContextMenuTrigger, {}, { slot: true, wrap: inContextMenu }),
  // No slot probe: the surface renders only once a right-click has set the virtual anchor, which
  // is an interaction concern, not a smoke one.
  smokeCase('ContextMenuContent', ContextMenuContent, {}, { wrap: inContextMenu }),
  smokeCase('Menubar', Menubar, {}, { slot: true }),
  smokeCase('MenubarMenu', MenubarMenu, { value: 'file' }, { slot: true, wrap: inMenubar }),
  smokeCase('MenubarTrigger', MenubarTrigger, {}, { slot: true, wrap: inMenubarMenu }),
  smokeCase('MenubarContent', MenubarContent, {}, { slot: true, wrap: inMenubarMenu }),
  smokeCase('NavigationMenu', NavigationMenu, {}, { slot: true }),
  smokeCase('NavigationMenuList', NavigationMenuList, {}, { slot: true, wrap: inNavigationMenu }),
  smokeCase(
    'NavigationMenuItem',
    NavigationMenuItem,
    { value: 'products' },
    { slot: true, wrap: inNavigationMenuList },
  ),
  smokeCase('NavigationMenuTrigger', NavigationMenuTrigger, {}, { slot: true, wrap: inNavigationMenuItem }),
  smokeCase('NavigationMenuContent', NavigationMenuContent, {}, { slot: true, wrap: inNavigationMenuItem }),
  smokeCase('NavigationMenuLink', NavigationMenuLink, {}, { slot: true, wrap: inNavigationMenu }),
  smokeCase('CommandPaletteModal', CommandPaletteModal, {}, { slot: true }),
  smokeCase('CommandPaletteModalContent', CommandPaletteModalContent, {}, { slot: true, wrap: inCommandPalette }),
  smokeCase('CommandPaletteModalInput', CommandPaletteModalInput, {}, { wrap: inCommandPaletteContent }),
  smokeCase('CommandPaletteModalList', CommandPaletteModalList, {}, { slot: true, wrap: inCommandPaletteContent }),
  smokeCase('CommandPaletteModalGroup', CommandPaletteModalGroup, {}, { slot: true, wrap: inCommandPaletteList }),
  smokeCase(
    'CommandPaletteModalItem',
    CommandPaletteModalItem,
    { value: 'open-settings' },
    { slot: true, wrap: inCommandPaletteList },
  ),
  smokeCase('CommandPaletteModalEmpty', CommandPaletteModalEmpty, {}, { slot: true, wrap: inCommandPaletteList }),
  smokeCase('CommandPaletteModalSeparator', CommandPaletteModalSeparator, {}, { wrap: inCommandPaletteList }),
  smokeCase('ScrollSpy', ScrollSpy, { ids: ['intro', 'usage'] }, { slot: true }),
  smokeCase('TableOfContents', TableOfContents, {}),
];
