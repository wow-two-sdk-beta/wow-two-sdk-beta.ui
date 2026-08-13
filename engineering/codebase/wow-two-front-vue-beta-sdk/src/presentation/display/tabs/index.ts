export { default as Tabs, type TabsProps } from './Tabs.vue';
/* React attached these as `Tabs.List` / `.Tab` / `.Panel` via `Object.assign`. An
   SFC's generated default export cannot carry statics cleanly, so they ship as siblings. */
export { default as TabsList, type TabsListProps } from './TabsList.vue';
export { default as TabsTab, type TabsTabProps } from './TabsTab.vue';
export { default as TabsPanel, type TabsPanelProps } from './TabsPanel.vue';
export { TabsActivationMode, useTabsContext, type TabsContextValue } from './TabsContext';
