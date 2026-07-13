import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LocaleProvider, useLocale } from '@src/foundation/i18n/LocaleContext';
import { FormattedRelative } from '@src/foundation/i18n/FormattedRelative';

afterEach(cleanup);

function Probe() {
  const { locale, t } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="label">{t('greeting', { name: 'Sam' }, 'Hi {name}')}</span>
      <span data-testid="rel">
        <FormattedRelative value={-2} unit="day" />
      </span>
    </div>
  );
}

describe('LocaleProvider', () => {
  it('provides the locale + fallback messages and renders FormattedRelative', () => {
    render(
      <LocaleProvider locale="en-US">
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('en-US');
    expect(screen.getByTestId('label')).toHaveTextContent('Hi Sam');
    expect(screen.getByTestId('rel')).toHaveTextContent('2 days ago');
  });

  it('applies consumer message overrides', () => {
    render(
      <LocaleProvider locale="en-US" messages={{ greeting: 'Hello {name}!' }}>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('label')).toHaveTextContent('Hello Sam!');
  });

  it('works without a provider (en-US fallback)', () => {
    render(<Probe />);
    expect(screen.getByTestId('locale')).toHaveTextContent('en-US');
    expect(screen.getByTestId('label')).toHaveTextContent('Hi Sam');
  });
});
