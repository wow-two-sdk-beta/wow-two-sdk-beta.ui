# RouteAnnouncer

## Contract

`RouteAnnouncer` renders one polite, atomic, visually hidden live region. A path change moves focus to
`#app-shell-main`, the first `main`, or the first `h1`, then announces the deepest resolved route title.
Search-only and hash-only changes do not move focus or announce again.

`skipInitial` defaults to `true`. Set it to `false` when the first client render must focus and announce.
The component performs no document work during server rendering.

## Navigation timing

Path changes announce after Vue patches the routed DOM, focusing the new main element. Rapid superseding routes
and disposal invalidate pending announcements. Query-only changes remain silent; repeated titles are cleared
for one update before being announced again. Async route content that renders after its own later loading state
remains application-controlled.
