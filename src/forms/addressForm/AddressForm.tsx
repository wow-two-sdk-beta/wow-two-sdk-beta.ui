import { forwardRef, useId, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { inputBaseVariants } from '../InputStyles';

export interface Address {
  country: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
}

interface CountryConfig {
  iso: string;
  name: string;
  regionLabel: string;
  postalLabel: string;
  regionOptions?: Array<{ value: string; label: string }>;
}

const COUNTRIES: CountryConfig[] = [
  {
    iso: 'US',
    name: 'United States',
    regionLabel: 'State',
    postalLabel: 'ZIP code',
    regionOptions: [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
      'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
      'VA', 'WA', 'WV', 'WI', 'WY',
    ].map((s) => ({ value: s, label: s })),
  },
  {
    iso: 'CA',
    name: 'Canada',
    regionLabel: 'Province',
    postalLabel: 'Postal code',
    regionOptions: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'].map(
      (s) => ({ value: s, label: s }),
    ),
  },
  { iso: 'GB', name: 'United Kingdom', regionLabel: 'County', postalLabel: 'Postcode' },
  { iso: 'DE', name: 'Germany', regionLabel: 'Bundesland', postalLabel: 'PLZ' },
  { iso: 'FR', name: 'France', regionLabel: 'Région', postalLabel: 'Code postal' },
  { iso: 'AU', name: 'Australia', regionLabel: 'State', postalLabel: 'Postcode' },
  { iso: 'JP', name: 'Japan', regionLabel: 'Prefecture', postalLabel: '〒' },
];

const FALLBACK: CountryConfig = {
  iso: 'XX',
  name: 'Other',
  regionLabel: 'Region',
  postalLabel: 'Postal code',
};

function configFor(iso: string): CountryConfig {
  return COUNTRIES.find((c) => c.iso === iso) ?? FALLBACK;
}

export interface AddressFormProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: Address;
  defaultValue?: Address;
  onValueChange?: (address: Address) => void;
  disabled?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  /** Prefix for hidden inputs (`{name}.line1`, etc.). */
  name?: string;
}

const EMPTY: Address = { country: 'US', line1: '', city: '', region: '', postalCode: '' };

/**
 * Country-aware address form. Country select drives the region label/options
 * and postal-code label. Built-in config for US/CA/GB/DE/FR/AU/JP; generic
 * fallback for the rest.
 */
export const AddressForm = forwardRef<HTMLDivElement, AddressFormProps>(
  function AddressForm(
    { value: valueProp, defaultValue, onValueChange, disabled, readOnly, compact, name, className, ...rest },
    ref,
  ) {
    const [address, setAddress] = useControlled({
      controlled: valueProp,
      default: defaultValue ?? EMPTY,
      onChange: onValueChange,
    });

    const config = configFor(address.country);
    const ids = {
      country: useId(),
      line1: useId(),
      line2: useId(),
      city: useId(),
      region: useId(),
      postal: useId(),
    };

    const update = (patch: Partial<Address>) => setAddress({ ...address, ...patch });

    return (
      <div ref={ref} className={cn('flex flex-col gap-3', className)} {...rest}>
        {/* Country */}
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.country} className="text-xs font-medium text-foreground">
            Country
          </label>
          <select
            id={ids.country}
            value={address.country}
            disabled={disabled || readOnly}
            onChange={(e) => update({ country: e.target.value, region: '' })}
            className={cn(inputBaseVariants({ size: 'md' }))}
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name}
              </option>
            ))}
            <option value="XX">Other</option>
          </select>
        </div>
        {/* Line 1 */}
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.line1} className="text-xs font-medium text-foreground">
            Address line 1
          </label>
          <input
            id={ids.line1}
            type="text"
            autoComplete="address-line1"
            value={address.line1}
            disabled={disabled}
            readOnly={readOnly}
            onChange={(e) => update({ line1: e.target.value })}
            className={cn(inputBaseVariants({ size: 'md' }))}
          />
        </div>
        {/* Line 2 */}
        <div className="flex flex-col gap-1">
          <label htmlFor={ids.line2} className="text-xs font-medium text-muted-foreground">
            Address line 2 <span className="text-[10px]">(optional)</span>
          </label>
          <input
            id={ids.line2}
            type="text"
            autoComplete="address-line2"
            value={address.line2 ?? ''}
            disabled={disabled}
            readOnly={readOnly}
            onChange={(e) => update({ line2: e.target.value })}
            className={cn(inputBaseVariants({ size: 'md' }))}
          />
        </div>
        {/* City + Region + Postal */}
        <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-3')}>
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.city} className="text-xs font-medium text-foreground">
              City
            </label>
            <input
              id={ids.city}
              type="text"
              autoComplete="address-level2"
              value={address.city}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(e) => update({ city: e.target.value })}
              className={cn(inputBaseVariants({ size: 'md' }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.region} className="text-xs font-medium text-foreground">
              {config.regionLabel}
            </label>
            {config.regionOptions ? (
              <select
                id={ids.region}
                value={address.region}
                disabled={disabled || readOnly}
                onChange={(e) => update({ region: e.target.value })}
                className={cn(inputBaseVariants({ size: 'md' }))}
              >
                <option value="">—</option>
                {config.regionOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={ids.region}
                type="text"
                autoComplete="address-level1"
                value={address.region}
                disabled={disabled}
                readOnly={readOnly}
                onChange={(e) => update({ region: e.target.value })}
                className={cn(inputBaseVariants({ size: 'md' }))}
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.postal} className="text-xs font-medium text-foreground">
              {config.postalLabel}
            </label>
            <input
              id={ids.postal}
              type="text"
              autoComplete="postal-code"
              value={address.postalCode}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(e) => update({ postalCode: e.target.value })}
              className={cn(inputBaseVariants({ size: 'md' }))}
            />
          </div>
        </div>
        {name && (
          <>
            <input type="hidden" name={`${name}.country`} value={address.country} />
            <input type="hidden" name={`${name}.line1`} value={address.line1} />
            <input type="hidden" name={`${name}.line2`} value={address.line2 ?? ''} />
            <input type="hidden" name={`${name}.city`} value={address.city} />
            <input type="hidden" name={`${name}.region`} value={address.region} />
            <input type="hidden" name={`${name}.postalCode`} value={address.postalCode} />
          </>
        )}
      </div>
    );
  },
);

export const ADDRESS_COUNTRIES = COUNTRIES;
