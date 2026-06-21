import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Link } from '@wow-two-beta/ui/actions';
import {
  Badge,
  Card,
  CountUp,
  Eyebrow,
  GradientText,
  Heading,
  Separator,
  Stat,
  Text,
  Typewriter,
} from '@wow-two-beta/ui/display';
import { Container, Surface } from '@wow-two-beta/ui/layout';
import manifestJson from '../../manifest.gen.json';

/* ------------------------------------------------------------------ */
/* Live coverage — computed from the generated manifest so the numbers */
/* can never silently go stale.                                        */
/* ------------------------------------------------------------------ */

interface CoverageManifest {
  /** Every named export per lib domain barrel (the full component universe). */
  domains: Record<string, string[]>;
  /** Per page module, the `domain/Name` named imports it actually uses. */
  routes: Record<string, string[]>;
}

const manifest = manifestJson as unknown as CoverageManifest;

const totalByDomain: Record<string, number> = {};
const universe = new Set<string>();
for (const [domain, names] of Object.entries(manifest.domains)) {
  totalByDomain[domain] = names.length;
  for (const name of names) universe.add(`${domain}/${name}`);
}

const usedSet = new Set<string>();
for (const imports of Object.values(manifest.routes)) {
  for (const entry of imports) {
    if (universe.has(entry)) usedSet.add(entry);
  }
}

const usedByDomain: Record<string, number> = {};
for (const entry of usedSet) {
  const domain = entry.split('/')[0];
  if (domain) usedByDomain[domain] = (usedByDomain[domain] ?? 0) + 1;
}

const totalExports = universe.size;
const usedExports = usedSet.size;
const coveragePct = totalExports === 0 ? 0 : Math.round((usedExports / totalExports) * 100);
const routeModules = Object.keys(manifest.routes).length;
const domainCount = Object.keys(manifest.domains).length;

/* ------------------------------------------------------------------ */
/* Domain gallery cards                                                */
/* ------------------------------------------------------------------ */

interface DomainCard {
  id: string;
  title: string;
  blurb: string;
  path: string;
}

const DOMAIN_CARDS: DomainCard[] = [
  {
    id: 'actions',
    title: 'Actions',
    blurb: 'Buttons, button groups, toggles, toolbars, FABs, speed dials and copy actions.',
    path: '/galleries/actions',
  },
  {
    id: 'display',
    title: 'Display',
    blurb: 'Typography, cards, tables, data grids, timelines, calendars, chat and motion accents.',
    path: '/galleries/display',
  },
  {
    id: 'feedback',
    title: 'Feedback',
    blurb: 'Toasts, alerts, banners, progress, presence, tours and notification centers.',
    path: '/galleries/feedback',
  },
  {
    id: 'forms',
    title: 'Forms',
    blurb: 'Inputs of every shape — selects, date & color pickers, editors, wizards, composers.',
    path: '/galleries/forms',
  },
  {
    id: 'layout',
    title: 'Layout',
    blurb: 'Stacks, grids, containers, app shells, resizable panels and surfaces.',
    path: '/galleries/layout',
  },
  {
    id: 'nav',
    title: 'Nav',
    blurb: 'Menus, breadcrumbs, pagination, command palette and table of contents.',
    path: '/galleries/nav',
  },
  {
    id: 'overlays',
    title: 'Overlays',
    blurb: 'Dialogs, drawers, popovers, hover cards, action sheets and bottom sheets.',
    path: '/galleries/overlays',
  },
  {
    id: 'primitives',
    title: 'Primitives',
    blurb: 'Headless L2 layer — slots, portals, focus scopes, positioners, roving focus.',
    path: '/galleries/primitives',
  },
];

const HERO_PHRASES = [
  'dashboards.',
  'chat apps.',
  'billing flows.',
  'media tools.',
  'every screen.',
];

const STACK_BADGES = [
  'React 19',
  'TypeScript strict',
  'Tailwind v4',
  `${domainCount} subpath domains`,
  'beta-forever',
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero */}
      <section>
        <Container size="xl" className="flex flex-col items-center gap-5 pt-12 text-center">
          <Badge variant="brand" size="lg">
            v0.x — ships from main, fix-forward
          </Badge>
          <Eyebrow level={2} tone="subtle">
            wow-two-sdk-beta
          </Eyebrow>
          <Heading level={1} size="4xl" align="center">
            <GradientText isAnimated>@wow-two-beta/ui</GradientText>
          </Heading>
          <Heading
            level={2}
            size="xl"
            weight="medium"
            align="center"
            className="text-muted-foreground"
          >
            One React library for{' '}
            <Typewriter
              text={HERO_PHRASES}
              className="text-foreground"
              aria-label="dashboards, chat apps, billing flows, media tools, every screen"
            />
          </Heading>
          <Text size="lg" color="muted" align="center" className="max-w-2xl">
            The beta-forever UI layer of the wow-two ecosystem — foundation tokens, headless
            primitives and {domainCount} component domains, each importable as its own subpath.
            This showcase dogfoods the library on real screens.
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {STACK_BADGES.map((label) => (
              <Badge key={label} variant="outline" size="sm">
                {label}
              </Badge>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="solid"
              tone="primary"
              size="lg"
              onClick={() => navigate('/app/dashboard')}
            >
              Explore the screens
            </Button>
            {/* Showcase deploys under /showcase/ — Storybook sits one level up. */}
            <Button variant="outline" tone="neutral" size="lg" asChild>
              <a href="../">Storybook catalog ↗</a>
            </Button>
          </div>
        </Container>
      </section>

      {/* Live coverage */}
      <section>
        <Container size="xl" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow level={2}>Live coverage</Eyebrow>
            <Link asChild variant="default" size="sm">
              <RouterLink to="/coverage">Full coverage report →</RouterLink>
            </Link>
          </div>
          <Surface
            variant="outline"
            radius="xl"
            padding="2xl"
            className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4"
          >
            <Stat
              label="Export coverage"
              value={<CountUp to={coveragePct} format={(v) => `${v.toFixed(0)}%`} />}
              helper={`${usedExports} of ${totalExports} exports exercised`}
            />
            <Stat
              label="Library exports"
              value={<CountUp to={totalExports} />}
              helper={`across ${domainCount} subpath domains`}
            />
            <Stat
              label="Used on routes"
              value={<CountUp to={usedExports} />}
              helper="distinct named imports in page code"
            />
            <Stat
              label="Route modules"
              value={<CountUp to={routeModules} />}
              helper="screens + galleries, auto-scanned"
            />
          </Surface>
          <Text size="xs" color="subtle">
            Numbers come straight from <code>manifest.gen.json</code> — regenerated on every build
            from the lib barrels and this app's imports, so they can never go stale.
          </Text>
        </Container>
      </section>

      {/* Domain galleries */}
      <section>
        <Container size="xl" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Eyebrow level={2}>Component domains</Eyebrow>
            <Heading level={2} size="2xl">
              Eight galleries, one import away
            </Heading>
            <Text color="muted">
              Each domain is a subpath export — <code>@wow-two-beta/ui/&#123;domain&#125;</code>.
              Pick the slice you need.
            </Text>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {DOMAIN_CARDS.map((domain) => {
              const total = totalByDomain[domain.id] ?? 0;
              const used = usedByDomain[domain.id] ?? 0;
              return (
                <RouterLink
                  key={domain.id}
                  to={domain.path}
                  className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Card className="flex h-full flex-col transition-colors group-hover:border-primary">
                    <Card.Header>
                      <div className="flex items-center justify-between gap-2">
                        <Card.Title>{domain.title}</Card.Title>
                        <Badge variant="brand" size="sm">
                          {total} exports
                        </Badge>
                      </div>
                      <Card.Description>{domain.blurb}</Card.Description>
                    </Card.Header>
                    <Card.Footer className="mt-auto justify-between">
                      <Text as="span" size="xs" color="muted">
                        {used} used in showcase
                      </Text>
                      <Text
                        as="span"
                        size="sm"
                        color="brand"
                        className="transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      >
                        →
                      </Text>
                    </Card.Footer>
                  </Card>
                </RouterLink>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Footer */}
      <section>
        <Container size="xl" className="flex flex-col gap-4">
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text size="sm" color="muted">
              Built with its own components — the shell, nav and every screen here import from{' '}
              <code>@wow-two-beta/ui</code>.
            </Text>
            <div className="flex items-center gap-4">
              <Link asChild variant="muted" size="sm">
                <RouterLink to="/galleries/display">Browse galleries</RouterLink>
              </Link>
              <Link href="../" variant="muted" size="sm">
                Storybook ↗
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
