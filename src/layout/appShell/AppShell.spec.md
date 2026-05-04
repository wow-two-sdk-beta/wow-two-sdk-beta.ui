# AppShell

## Purpose
Top-level page frame: Header / Sidebar / Main / Aside / Footer slots arranged in a CSS grid. Responsive: sidebar collapses to a drawer below a breakpoint.

## Anatomy
```
<AppShell sidebarWidth="240px" asideWidth="280px">
  <AppShell.Header />
  <AppShell.Sidebar />
  <AppShell.Main>
    <AppShell.Content />
    <AppShell.Aside />
  </AppShell.Main>
  <AppShell.Footer />
</AppShell>
```

## Required behaviors
- Header sticky at top.
- Sidebar fixed/sticky on the side; collapses on `< sidebarBreakpoint` (default `lg`) with mobile-drawer mode.
- Aside (right rail) sticky; hides on `< asideBreakpoint` (default `xl`).
- Content scrolls; header/sidebar/footer don't.

## Props (root)
| Name | Type | Default | Why |
|---|---|---|---|
| `sidebarWidth` | `string` | `'240px'` | CSS width |
| `asideWidth` | `string` | `'280px'` | |
| `sidebarBreakpoint` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'lg'` | Collapse below this |
| `asideBreakpoint` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'xl'` | Hide below this |
| `sidebarOpen` / `defaultSidebarOpen` / `onSidebarOpenChange` | controlled | uncontrolled (drawer mode) | Mobile sidebar state |

## Composition
Compound — slots auto-positioned by their child key (Header → top, Sidebar → left, Main → main, Aside → right, Footer → bottom).

## Accessibility
- `<header role="banner">`, `<nav>` for sidebar, `<main>`, `<aside>`, `<footer role="contentinfo">`.
- Skip-link automatically rendered as the first focusable element.
- Mobile sidebar uses `Drawer` for proper focus-trap + Escape.

## Dependencies
Foundation: `utils`, `hooks/useMediaQuery`, `hooks/useControlled`. Cross-domain: `overlays/Drawer` for mobile sidebar.
