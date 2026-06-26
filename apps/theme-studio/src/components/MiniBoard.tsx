import { Button } from '@wow-two-beta/ui/actions';
import { Badge } from '@wow-two-beta/ui/display';
import { TextInput } from '@wow-two-beta/ui/forms';

/* Compact token swatch board shown inside each gallery card: page bg + a nested
   card + the key tones as buttons + an input + a badge. Token classes only, so
   it re-resolves to whichever theme/mode wraps it. Non-interactive (pointer
   events disabled by the caller) — it's a visual sample, not a control. */
export function MiniBoard() {
  return (
    <div className="rounded-md bg-background p-3">
      <div className="rounded-md border border-border bg-card p-3 text-card-foreground">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold">Aa Card</span>
          <Badge variant="brand" size="sm">
            New
          </Badge>
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Button size="xs" variant="solid" tone="primary">
            Primary
          </Button>
          <Button size="xs" variant="soft" tone="primary">
            Accent
          </Button>
          <Button size="xs" variant="solid" tone="danger">
            Delete
          </Button>
        </div>
        <TextInput size="sm" placeholder="Input…" readOnly tabIndex={-1} />
      </div>
    </div>
  );
}
