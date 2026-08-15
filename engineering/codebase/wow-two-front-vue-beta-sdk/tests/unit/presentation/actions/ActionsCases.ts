import { h } from 'vue';
import {
  BackToTopButton,
  Button,
  ButtonGroup,
  CopyButton,
  DisclosureButton,
  FAB,
  GoogleSignInButton,
  Link,
  OptionTile,
  OptionTileGroup,
  SegmentedControl,
  SpeedDial,
  SpeedDialAction,
  SpeedDialTrigger,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
} from '@src/presentation/actions';
import { smokeCase, type SmokeCase } from '../../../support/Smoke';

/**
 * Every component `@wow-two-beta/ui-vue/presentation/actions` exports, as smoke cases.
 * Imported through the public barrel on purpose — a component missing from `index.ts` fails
 * here before a consumer finds it.
 */
export const actionsCases: readonly SmokeCase[] = [
  smokeCase('Button', Button, {}, { slot: true }),
  smokeCase('Link', Link, {}, { slot: true }),
  smokeCase('ButtonGroup', ButtonGroup, {}, { slot: true }),
  smokeCase('ToggleButton', ToggleButton, {}, { slot: true }),
  smokeCase('ToggleButtonGroup', ToggleButtonGroup, {}, { slot: true }),
  smokeCase('OptionTile', OptionTile, { selected: false, label: 'Option' }, { slot: true }),
  smokeCase('OptionTileGroup', OptionTileGroup, { label: 'Tiles' }, { slot: true }),
  smokeCase('SegmentedControl', SegmentedControl, {}, { slot: true }),
  // `aria-label` is required through FAB's `@vue-ignore`d heritage and reaches the DOM as a
  // fallthrough attr — never as a declared prop. `Actions.a11y.dom.test.ts` pins that it lands.
  smokeCase('FAB', FAB, { 'aria-label': 'Create' }, { slot: true }),
  smokeCase('CopyButton', CopyButton, { text: 'copied', 'aria-label': 'Copy' }, { slot: true }),
  smokeCase('DisclosureButton', DisclosureButton, {}, { slot: true }),
  smokeCase('BackToTopButton', BackToTopButton, {}),
  // No slot (Google draws the button into the host, so there is nothing to probe) and no client
  // id: an id would send the breadth tier off to fetch the real GIS script. The unconfigured path
  // is a supported state — apps without a client id stay guest-only — so this covers setup and the
  // SSR tier honestly, and `GoogleSignInButton.dom.test.ts` carries the rendered flow against a
  // stubbed client.
  smokeCase('GoogleSignInButton', GoogleSignInButton, {}),

  smokeCase('Toolbar', Toolbar, {}, { slot: true }),
  smokeCase(
    'ToolbarButton',
    ToolbarButton,
    {},
    {
      slot: true,
      wrap: (node) => h(Toolbar, null, () => node),
    },
  ),
  smokeCase(
    'ToolbarLink',
    ToolbarLink,
    {},
    {
      slot: true,
      wrap: (node) => h(Toolbar, null, () => node),
    },
  ),
  smokeCase(
    'ToolbarSeparator',
    ToolbarSeparator,
    {},
    {
      wrap: (node) => h(Toolbar, null, () => node),
    },
  ),

  // No slot probe: SpeedDial partitions its default slot by child component type (trigger vs
  // actions) and drops anything matching neither, so a generic probe node proves nothing. The
  // two real child types are covered by the `SpeedDialTrigger` / `SpeedDialAction` cases below.
  smokeCase('SpeedDial', SpeedDial, {}),
  smokeCase(
    'SpeedDialTrigger',
    SpeedDialTrigger,
    {},
    {
      wrap: (node) => h(SpeedDial, null, () => node),
    },
  ),
  smokeCase(
    'SpeedDialAction',
    SpeedDialAction,
    { 'aria-label': 'Share' },
    {
      wrap: (node) => h(SpeedDial, { defaultOpen: true }, () => node),
    },
  ),
];
