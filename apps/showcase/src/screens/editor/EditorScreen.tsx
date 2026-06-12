import { useState } from 'react';
import { Button, CopyButton } from '@wow-two-beta/ui/actions';
import {
  Code,
  DiffViewer,
  Eyebrow,
  Highlight,
  Kbd,
  KeyboardShortcut,
  Mark,
  Quote,
  SectionHeader,
  Snippet,
} from '@wow-two-beta/ui/display';
import { useToaster } from '@wow-two-beta/ui/feedback';
import {
  CharacterCount,
  CodeEditor,
  Editable,
  EditableCancel,
  EditableInput,
  EditablePreview,
  EditableSubmit,
  JSONEditor,
  Label,
  MarkdownEditor,
  Textarea,
} from '@wow-two-beta/ui/forms';
import { ScrollSpy, TableOfContents } from '@wow-two-beta/ui/nav';
import { users } from '../../fixtures';

/* ------------------------------------------------------------------ */
/* Deterministic content                                               */
/* ------------------------------------------------------------------ */

const INITIAL_MARKDOWN = `# Release runbook — v0.42

> Owned by the platform crew. Update **before** every cut.

## Pre-flight

- Freeze \`main\` and announce in #deploys
- Verify staging soak: error rate **< 0.5%** for 2h
- Confirm migrations are *reversible*

## Cut the release

1. Tag \`v0.42.0\` from the release branch
2. Run \`pnpm release --channel beta\`
3. Watch the canary dashboard for 15 minutes

## Rollback

If p95 latency exceeds 400ms, run \`pnpm release --rollback\`
and page the on-call engineer via [the escalation doc](https://example.com/escalation).
`;

const TS_SNIPPET = `import { defineConfig } from './config';

export interface ReleaseGate {
  name: string;
  maxErrorRate: number;
  soakMinutes: number;
}

const gates: ReleaseGate[] = [
  { name: 'staging-soak', maxErrorRate: 0.005, soakMinutes: 120 },
  { name: 'canary', maxErrorRate: 0.01, soakMinutes: 15 },
];

export const releaseConfig = defineConfig({
  channel: 'beta',
  gates,
  rollbackOn: ['p95>400ms', 'errors>1%'],
});
`;

const INITIAL_CONFIG: Record<string, unknown> = {
  service: 'release-bot',
  channel: 'beta',
  replicas: 3,
  canary: { weight: 0.1, soakMinutes: 15, autoPromote: true },
  alerts: { p95Ms: 400, errorRatePct: 1, pager: 'oncall-platform' },
  regions: ['eu-central-1', 'us-east-1'],
};

const CONFIG_BEFORE = `service: release-bot
channel: stable
replicas: 2
canary:
  weight: 0.25
  soakMinutes: 10
alerts:
  p95Ms: 500
  pager: oncall-platform
regions:
  - eu-central-1
`;

const CONFIG_AFTER = `service: release-bot
channel: beta
replicas: 3
canary:
  weight: 0.1
  soakMinutes: 15
  autoPromote: true
alerts:
  p95Ms: 400
  errorRatePct: 1
  pager: oncall-platform
regions:
  - eu-central-1
  - us-east-1
`;

const INSTALL_COMMAND = 'pnpm add @wow-two-beta/ui';
const RELEASE_BLOCK = `git tag v0.42.0
git push origin v0.42.0
pnpm release --channel beta`;

const SUMMARY_MAX = 140;

interface ShortcutRow {
  action: string;
  keys: string[];
}

const SHORTCUTS: ShortcutRow[] = [
  { action: 'Toggle preview pane', keys: ['⌘', 'Shift', 'P'] },
  { action: 'Save draft', keys: ['⌘', 'S'] },
  { action: 'Insert code block', keys: ['⌘', 'E'] },
  { action: 'Open command palette', keys: ['⌘', 'K'] },
  { action: 'Indent / outdent selection', keys: ['Tab'] },
];

interface TocSection {
  id: string;
  label: string;
  depth: number;
}

const TOC_SECTIONS: TocSection[] = [
  { id: 'compose', label: 'Compose', depth: 0 },
  { id: 'code-tools', label: 'Code tools', depth: 0 },
  { id: 'json-config', label: 'JSON config', depth: 1 },
  { id: 'config-diff', label: 'Config diff', depth: 0 },
  { id: 'snippets', label: 'Snippets & copy', depth: 0 },
  { id: 'shortcuts', label: 'Shortcuts', depth: 0 },
  { id: 'typography', label: 'Typography', depth: 0 },
];

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function EditorScreen() {
  const { toast } = useToaster();

  const [docTitle, setDocTitle] = useState('Release runbook — v0.42');
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [summary, setSummary] = useState(
    'Runbook for the v0.42 beta cut: pre-flight gates, release steps, rollback triggers.',
  );
  const [tsSource, setTsSource] = useState(TS_SNIPPET);
  const [config, setConfig] = useState<unknown>(INITIAL_CONFIG);
  const [diffView, setDiffView] = useState<'split' | 'unified'>('split');

  const owner = users[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
      {/* ---------------- Main column ---------------- */}
      <div className="min-w-0 space-y-10">
        {/* Compose */}
        <section id="compose" className="scroll-mt-20 space-y-4">
          <SectionHeader
            title={
              <Editable value={docTitle} onValueChange={(v) => setDocTitle(v)} placeholder="Untitled document">
                <EditablePreview className="text-lg font-semibold" />
                <EditableInput size="sm" aria-label="Document title" />
                <EditableSubmit />
                <EditableCancel />
              </Editable>
            }
            description={
              owner
                ? `Drafted by ${owner.name} (@${owner.handle}) — click the title to rename.`
                : 'Click the title to rename.'
            }
            actions={
              <Button
                size="sm"
                onClick={() =>
                  toast({
                    severity: 'success',
                    title: 'Draft saved',
                    description: `“${docTitle}” — ${markdown.length} characters.`,
                  })
                }
              >
                Save draft
              </Button>
            }
          />
          <MarkdownEditor
            value={markdown}
            onValueChange={setMarkdown}
            defaultView="split"
            minHeight="24rem"
            placeholder="Write the runbook…"
            aria-label="Document body"
          />
          <div className="space-y-1.5">
            <Label htmlFor="doc-summary">Changelog summary</Label>
            <Textarea
              id="doc-summary"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-paragraph summary for the release notes…"
            />
            <CharacterCount value={summary.length} max={SUMMARY_MAX} />
          </div>
        </section>

        {/* Code tools */}
        <section id="code-tools" className="scroll-mt-20 space-y-4">
          <SectionHeader
            title="Code tools"
            description="CodeEditor with a line gutter and Tab indenting; JSONEditor with tree + text modes."
          />
          <div className="space-y-1.5">
            <Label htmlFor="release-gates">release.config.ts</Label>
            <CodeEditor
              id="release-gates"
              language="typescript"
              value={tsSource}
              onValueChange={setTsSource}
              minHeight="14rem"
              aria-label="TypeScript release config"
            />
          </div>
          <div id="json-config" className="scroll-mt-20 space-y-1.5">
            <Label htmlFor="deploy-config">deploy.config.json</Label>
            <JSONEditor
              id="deploy-config"
              value={config}
              onValueChange={setConfig}
              defaultMode="tree"
              minHeight="16rem"
              aria-label="Deploy config JSON"
            />
            <p className="text-xs text-muted-foreground">
              Edit a leaf inline in tree mode, or switch to text mode and commit on blur.
            </p>
          </div>
        </section>

        {/* Config diff */}
        <section id="config-diff" className="scroll-mt-20 space-y-4">
          <SectionHeader
            title="Config diff"
            description="deploy.yaml — stable channel vs the beta cut."
            actions={
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={diffView === 'split' ? 'solid' : 'ghost'}
                  onClick={() => setDiffView('split')}
                >
                  Split
                </Button>
                <Button
                  size="sm"
                  variant={diffView === 'unified' ? 'solid' : 'ghost'}
                  onClick={() => setDiffView('unified')}
                >
                  Unified
                </Button>
              </div>
            }
          />
          <DiffViewer
            left={CONFIG_BEFORE}
            right={CONFIG_AFTER}
            view={diffView}
            leftLabel="deploy.yaml @ stable"
            rightLabel="deploy.yaml @ beta"
          />
        </section>

        {/* Snippets & copy */}
        <section id="snippets" className="scroll-mt-20 space-y-4">
          <SectionHeader
            title="Snippets & copy"
            description="Inline Code, Snippet with built-in copy, and a standalone CopyButton."
          />
          <p className="text-sm text-foreground">
            Install the library with <Code>{INSTALL_COMMAND}</Code>, then import from a subpath such as{' '}
            <Code>@wow-two-beta/ui/display</Code>.
          </p>
          <Snippet text={INSTALL_COMMAND} />
          <Snippet variant="block" text={RELEASE_BLOCK} />
          <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
            <div className="min-w-0 flex-1">
              <Eyebrow>Webhook URL</Eyebrow>
              <p className="truncate font-mono text-sm text-foreground">
                https://hooks.example.com/releases/v0-42
              </p>
            </div>
            <CopyButton
              size="sm"
              text="https://hooks.example.com/releases/v0-42"
              aria-label="Copy webhook URL"
              copiedAriaLabel="Webhook URL copied"
            />
          </div>
        </section>

        {/* Shortcuts */}
        <section id="shortcuts" className="scroll-mt-20 space-y-4">
          <SectionHeader
            title="Keyboard shortcuts"
            description="Kbd atoms and KeyboardShortcut sequences."
          />
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {SHORTCUTS.map((row) => (
                  <tr key={row.action} className="bg-card">
                    <td className="px-3 py-2 text-foreground">{row.action}</td>
                    <td className="px-3 py-2 text-right">
                      <KeyboardShortcut keys={row.keys} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Single keys render as a bare <Kbd>Esc</Kbd>; chords join with a separator.
          </p>
        </section>

        {/* Typography */}
        <section id="typography" className="scroll-mt-20 space-y-4">
          <SectionHeader
            title="Typography accents"
            description="Eyebrow, Quote, Highlight and Mark."
          />
          <div className="space-y-4 rounded-md border border-border bg-card p-4">
            <div className="space-y-1">
              <Eyebrow>From the postmortem</Eyebrow>
              <Quote>
                Every rollback we have ever run was rehearsed first. The runbook is the rehearsal.
              </Quote>
            </div>
            <p className="text-sm text-foreground">
              <Highlight query={['rollback', 'canary']}>
                The canary stage gates promotion: if error budgets burn during the soak, an automatic
                rollback fires before the stable channel is touched. Manual rollback remains available
                from the release dashboard.
              </Highlight>
            </p>
            <p className="text-sm text-foreground">
              Reviewers flagged one open question — <Mark>who owns pager triage during the freeze?</Mark>{' '}
              Resolve it before the cut.
            </p>
          </div>
        </section>
      </div>

      {/* ---------------- Right rail ---------------- */}
      <aside className="hidden lg:block">
        <div className="sticky top-4 space-y-4">
          <div>
            <Eyebrow className="mb-2">On this page</Eyebrow>
            <TableOfContents
              items={TOC_SECTIONS.map((s) => ({ id: s.id, label: s.label, depth: s.depth }))}
            />
          </div>
          <ScrollSpy ids={TOC_SECTIONS.map((s) => s.id)}>
            {({ activeId }) => {
              const active = TOC_SECTIONS.find((s) => s.id === activeId);
              return (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Reading: </span>
                  <span className="font-medium text-foreground">{active ? active.label : '—'}</span>
                </div>
              );
            }}
          </ScrollSpy>
        </div>
      </aside>
    </div>
  );
}
