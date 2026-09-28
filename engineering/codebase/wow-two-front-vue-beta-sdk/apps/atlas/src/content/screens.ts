/** A screen built from real SDK components that realizes one layout archetype. */
export interface Screen {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly summary: string;
  /** The SDK components the screen is built from, in reading order. */
  readonly components: ReadonlyArray<string>;
}

export const Screens: ReadonlyArray<Screen> = [
  {
    id: 'dashboard',
    name: 'Fleet dashboard',
    archetype: 'dashboard',
    summary: 'A sidebar shell with a KPI row, trend tiles and the records behind the numbers.',
    components: ['SidebarMenu', 'StatCard', 'Sparkline', 'ToggleGroup', 'DataTable', 'Badge', 'Alert'],
  },
  {
    id: 'board',
    name: 'Release board',
    archetype: 'board',
    summary: 'Shared filters above stage columns; cards move by drag or keyboard.',
    components: ['SearchInput', 'ToggleGroup', 'KanbanBoard', 'Tag', 'Avatar', 'EmptyState'],
  },
  {
    id: 'settings',
    name: 'Workspace settings',
    archetype: 'settings',
    summary: 'A section list beside grouped forms, with explicit save feedback.',
    components: ['NavItem', 'FieldsetLayout', 'LegendText', 'Field', 'TextInput', 'SwitchField', 'DescriptionGroup'],
  },
  {
    id: 'inbox',
    name: 'Support inbox',
    archetype: 'inbox',
    summary: 'Conversations, the open thread with a composer, and the customer in context.',
    components: ['SearchInput', 'Avatar', 'CountBadge', 'ChatBubbleCard', 'ChatComposerInput', 'DescriptionGroup'],
  },
];

export function findScreen(id: string | null | undefined): Screen | undefined {
  return Screens.find((screen) => screen.id === id);
}

/** The screen that realizes an archetype, when one exists. */
export function screenFor(archetype: string): Screen | undefined {
  return Screens.find((screen) => screen.archetype === archetype);
}
