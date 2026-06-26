import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { THEMES, ThemeStatus, type Theme } from '@wow-two-beta/ui/themes';
import { SegmentedControl, ToggleButton } from '@wow-two-beta/ui/actions';
import { Badge, Heading, Tag, Text } from '@wow-two-beta/ui/display';
import { cn } from '@wow-two-beta/ui/utils';
import { useThemeStudio } from '../theme/ThemeContext';
import { ThemePreviewScope } from '../theme/ThemePreviewScope';
import { MiniBoard } from '../components/MiniBoard';

/* Gallery filter — validated | candidate | all. `all` is the default but
   surfaces validated themes first (their own labelled section). */
type Filter = 'all' | typeof ThemeStatus.Validated | typeof ThemeStatus.Candidate;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: ThemeStatus.Validated, label: 'Validated' },
  { value: ThemeStatus.Candidate, label: 'Candidates' },
];

/* Sort validated first, then keep registry order (stable). */
function sortValidatedFirst(themes: Theme[]): Theme[] {
  return [...themes].sort((a, b) => {
    const av = a.status === ThemeStatus.Validated ? 0 : 1;
    const bv = b.status === ThemeStatus.Validated ? 0 : 1;
    return av - bv;
  });
}

/* Gallery — every theme in THEMES as a card, grouped by lifecycle status. Each
   card previews the theme via a locally-scoped MiniBoard (so the card shows the
   theme's own colors regardless of the active app theme) and carries a status
   chip. Clicking a card applies it app-wide and jumps to the preview board. */
export default function GalleryPage() {
  const { themeId, setThemeId, dark } = useThemeStudio();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  function applyTheme(id: string) {
    setThemeId(id);
    navigate('/preview');
  }

  const validated = useMemo(
    () => THEMES.filter((t) => t.status === ThemeStatus.Validated),
    [],
  );
  const candidates = useMemo(
    () => THEMES.filter((t) => t.status === ThemeStatus.Candidate),
    [],
  );

  /* What renders, honoring the active filter. `all` keeps the two-section split
     (validated on top); a single-status filter collapses to one flat grid. */
  const showValidated = filter === 'all' || filter === ThemeStatus.Validated;
  const showCandidates = filter === 'all' || filter === ThemeStatus.Candidate;
  const visibleCount =
    (showValidated ? validated.length : 0) + (showCandidates ? candidates.length : 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={1} size="2xl" weight="bold">
          Theme gallery
        </Heading>
        <Text color="muted" className="mt-1">
          {THEMES.length} themes — {validated.length} validated, {candidates.length} candidate.
          Click any card to apply it across the studio.
        </Text>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          type="single"
          value={filter}
          onValueChange={(v) => setFilter((v as Filter) ?? 'all')}
          aria-label="Filter themes by status"
        >
          {FILTERS.map(({ value, label }) => (
            <ToggleButton key={value} value={value} size="sm">
              {label}
            </ToggleButton>
          ))}
        </SegmentedControl>
        <Text size="sm" color="muted">
          {visibleCount} shown
        </Text>
      </div>

      {showValidated && validated.length > 0 && (
        <ThemeSection
          title="Validated"
          note="App-proven — safe to apply without rethinking."
          themes={validated}
          activeId={themeId}
          dark={dark}
          onApply={applyTheme}
        />
      )}

      {showCandidates && candidates.length > 0 && (
        <ThemeSection
          title="Candidates"
          note="AA-proven, not yet app-validated."
          themes={candidates}
          activeId={themeId}
          dark={dark}
          onApply={applyTheme}
        />
      )}

      {visibleCount === 0 && (
        <Text color="muted">No themes match this filter.</Text>
      )}
    </div>
  );
}

/* One labelled status group + its card grid. Cards are sorted validated-first so
   a mixed list (e.g. a future "all" flat view) still leads with proven themes. */
function ThemeSection({
  title,
  note,
  themes,
  activeId,
  dark,
  onApply,
}: {
  title: string;
  note: string;
  themes: Theme[];
  activeId: string;
  dark: boolean;
  onApply: (id: string) => void;
}) {
  const sorted = useMemo(() => sortValidatedFirst(themes), [themes]);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <Heading level={2} size="lg" weight="semibold">
          {title}
        </Heading>
        <Text size="xs" color="muted">
          {themes.length} · {note}
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeId}
            dark={dark}
            onApply={onApply}
          />
        ))}
      </div>
    </section>
  );
}

function ThemeCard({
  theme,
  isActive,
  dark,
  onApply,
}: {
  theme: Theme;
  isActive: boolean;
  dark: boolean;
  onApply: (id: string) => void;
}) {
  const isValidated = theme.status === ThemeStatus.Validated;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`Apply ${theme.name} theme`}
      onClick={() => onApply(theme.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onApply(theme.id);
        }
      }}
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive
          ? 'border-primary ring-2 ring-primary'
          : 'border-border hover:border-border-strong',
      )}
    >
      {/* Decorative themed preview — scoped to this card's theme + mode; inert (no nested interactives in the a11y tree). */}
      <ThemePreviewScope
        themeId={theme.id}
        isDark={dark}
        aria-hidden
        className="pointer-events-none p-3"
      >
        <MiniBoard />
      </ThemePreviewScope>

      {/* Meta strip — rendered in the active app theme. */}
      <div className="flex flex-1 flex-col gap-2 border-t border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-semibold text-card-foreground">
            {theme.name}
          </span>
          {/* Status chip — distinct success Badge for validated vs muted Tag for candidate. */}
          {isValidated ? (
            <Badge variant="success" size="sm" className="shrink-0">
              Validated
            </Badge>
          ) : (
            <Tag variant="neutral" className="shrink-0 text-muted-foreground">
              Candidate
            </Tag>
          )}
        </div>
        <Text size="xs" color="muted" className="line-clamp-2">
          {theme.description}
        </Text>
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
          {theme.meta.contrastAA ? (
            <Badge variant="success" size="sm">
              AA
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              AA?
            </Badge>
          )}
          {theme.tags.map((tag) => (
            <Tag key={tag} variant="neutral">
              {tag}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
}
