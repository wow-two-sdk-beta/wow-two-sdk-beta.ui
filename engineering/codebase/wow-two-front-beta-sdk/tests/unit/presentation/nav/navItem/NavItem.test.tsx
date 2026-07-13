import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NavItem } from '@src/presentation/nav/navItem/NavItem';

afterEach(cleanup);

/*
 * The bug: `<NavItem asChild>` fed THREE children (icon / label / trailing) into
 * `Slot`, which requires a single element child — so any `asChild` usage threw
 * `React.Children.only expected to receive a single React element child`.
 * These cover the crash path + the surrounding contract.
 */
describe('NavItem — asChild', () => {
  it('renders a single anchor with icon + label when asChild AND icon are set (the crash path)', () => {
    render(
      <NavItem asChild isActive icon={<svg data-testid="icon" />}>
        <a href="/inbox">Inbox</a>
      </NavItem>,
    );

    // Exactly one <a> — the consumer's Link, not a wrapper.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/inbox');
    // Active state forwarded onto the merged element.
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-active', '');
    // Icon + label compose inside the anchor.
    expect(within(link).getByTestId('icon')).toBeInTheDocument();
    expect(within(link).getByText('Inbox')).toBeInTheDocument();
    // Label keeps its flex-1/truncate treatment.
    expect(within(link).getByText('Inbox')).toHaveClass('flex-1', 'truncate', 'text-left');
  });

  it('renders a single anchor with label when asChild WITHOUT an icon', () => {
    render(
      <NavItem asChild>
        <a href="/settings">Settings</a>
      </NavItem>,
    );

    expect(screen.getAllByRole('link')).toHaveLength(1);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/settings');
    expect(within(link).getByText('Settings')).toHaveClass('flex-1', 'truncate', 'text-left');
  });

  it('merges the nav row className onto the consumer element while keeping its own', () => {
    render(
      <NavItem asChild className="extra">
        <a href="/x" className="link-own">
          X
        </a>
      </NavItem>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('link-own'); // child class preserved
    expect(link).toHaveClass('extra'); // NavItem className forwarded
    expect(link).toHaveClass('inline-flex'); // base nav row class applied
  });
});

describe('NavItem — default <a> (regression)', () => {
  it('renders an anchor with icon + label + trailing when not asChild', () => {
    render(
      <NavItem href="/inbox" icon={<svg data-testid="icon" />} trailing={<span data-testid="badge">3</span>}>
        Inbox
      </NavItem>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/inbox');
    expect(within(link).getByTestId('icon')).toBeInTheDocument();
    expect(within(link).getByTestId('badge')).toBeInTheDocument();
    expect(within(link).getByText('Inbox')).toHaveClass('flex-1', 'truncate', 'text-left');
  });
});
