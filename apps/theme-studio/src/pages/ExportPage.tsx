import { useMemo } from 'react';
import { themeToCss, ThemeStatus } from '@wow-two-beta/ui/themes';
import { CopyButton } from '@wow-two-beta/ui/actions';
import { Badge, Heading, Tabs, TabsList, TabsPanel, TabsTab, Text } from '@wow-two-beta/ui/display';
import { useThemeStudio } from '../theme/ThemeContext';

/* Export — everything needed to ship the active theme: the scoped `.theme-{id}`
   CSS (themeToCss), the raw light/dark token JSON, and a paste-ready "use theme
   X" snippet. Each block has a CopyButton. */
export default function ExportPage() {
  const { theme } = useThemeStudio();

  const isValidated = theme.status === ThemeStatus.Validated;
  const css = useMemo(() => themeToCss(theme), [theme]);
  const tokenJson = useMemo(
    () =>
      JSON.stringify(
        { id: theme.id, name: theme.id, light: theme.light, dark: theme.dark },
        null,
        2,
      ),
    [theme],
  );
  const snippet = useMemo(
    () =>
      [
        `// 1. Import the themes stylesheet once (e.g. in your entry file):`,
        `import '@wow-two-beta/ui/themes.css';`,
        ``,
        `// 2. Add the theme class to a root element (toggle \`dark\` for dark mode):`,
        `<html class="theme-${theme.id}">      {/* light */}`,
        `<html class="dark theme-${theme.id}"> {/* dark  */}`,
        ``,
        `// Programmatic lookup:`,
        `import { getTheme } from '@wow-two-beta/ui/themes';`,
        `const theme = getTheme('${theme.id}');`,
      ].join('\n'),
    [theme],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading level={1} size="2xl" weight="bold">
            Export — {theme.name}
          </Heading>
          <Text color="muted" className="mt-1">
            Drop these into any app to ship the <code>theme-{theme.id}</code> theme.
            {isValidated
              ? ' App-validated — proven on a real app surface.'
              : ' Candidate — AA-proven, not yet app-validated.'}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isValidated ? (
            <Badge variant="success">Validated</Badge>
          ) : (
            <Badge variant="neutral">Candidate</Badge>
          )}
          {theme.meta.contrastAA ? (
            <Badge variant="success">WCAG AA proven</Badge>
          ) : (
            <Badge variant="warning">AA unverified</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="snippet">
        <TabsList>
          <TabsTab value="snippet">Use theme</TabsTab>
          <TabsTab value="css">CSS</TabsTab>
          <TabsTab value="json">Token JSON</TabsTab>
        </TabsList>

        <TabsPanel value="snippet" className="pt-4">
          <ExportBlock label="Apply snippet" text={snippet} />
        </TabsPanel>
        <TabsPanel value="css" className="pt-4">
          <ExportBlock label={`.theme-${theme.id} CSS`} text={css} />
        </TabsPanel>
        <TabsPanel value="json" className="pt-4">
          <ExportBlock label="Token JSON" text={tokenJson} />
        </TabsPanel>
      </Tabs>
    </div>
  );
}

function ExportBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <Text size="sm" weight="medium">
          {label}
        </Text>
        <CopyButton text={text} aria-label={`Copy ${label}`} size="sm" variant="soft" tone="neutral">
          {({ copied }) => (copied ? 'Copied!' : 'Copy')}
        </CopyButton>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-4 text-xs leading-relaxed text-card-foreground">
        <code>{text}</code>
      </pre>
    </div>
  );
}
