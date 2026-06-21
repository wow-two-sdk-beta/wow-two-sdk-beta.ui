import { forwardRef, useMemo, useState, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { inputBaseVariants } from '../InputStyles';

export interface PhoneCountry {
  iso: string;
  name: string;
  dial: string; // includes leading +
  flag: string; // emoji
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { iso: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { iso: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { iso: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { iso: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { iso: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { iso: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { iso: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { iso: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { iso: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { iso: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { iso: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { iso: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { iso: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { iso: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { iso: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { iso: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { iso: 'CZ', name: 'Czechia', dial: '+420', flag: '🇨🇿' },
  { iso: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { iso: 'TR', name: 'Türkiye', dial: '+90', flag: '🇹🇷' },
  { iso: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { iso: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { iso: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { iso: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { iso: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { iso: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { iso: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { iso: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { iso: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { iso: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { iso: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { iso: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { iso: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { iso: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { iso: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { iso: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { iso: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { iso: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { iso: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { iso: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { iso: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { iso: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { iso: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { iso: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { iso: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { iso: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { iso: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { iso: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
];

export interface PhoneInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (e164: string) => void;
  defaultCountry?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  placeholder?: string;
  name?: string;
}

function splitE164(value: string, defaultIso: string): { iso: string; national: string } {
  if (!value) return { iso: defaultIso, national: '' };
  // Match the longest dial code prefix.
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (value.startsWith(c.dial)) {
      return { iso: c.iso, national: value.slice(c.dial.length).replace(/\D/g, '') };
    }
  }
  return { iso: defaultIso, national: value.replace(/\D/g, '') };
}

/**
 * International phone input — country dial-code select + national-number
 * input. Output is E.164 (`+<country><number>`). First-gen list; full
 * `libphonenumber` validation/format deferred.
 */
export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  function PhoneInput(
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      defaultCountry = 'US',
      isDisabled,
      isReadOnly,
      isInvalid,
      placeholder = '(555) 555-5555',
      name,
      className,
      ...rest
    },
    ref,
  ) {
    const [value, setValue] = useControlled<string>({
      controlled: valueProp,
      default: defaultValue ?? '',
      onChange: onValueChange,
    });
    /* Selected ISO is state — shared dial codes (+1 US/CA) make it unrecoverable from the value alone. Re-derive only when the value's dial prefix becomes incompatible with the selection. */
    const [selectedIso, setSelectedIso] = useState(defaultCountry);
    const { iso, national } = useMemo(() => {
      const selected = PHONE_COUNTRIES.find((c) => c.iso === selectedIso);
      if (selected && (!value || value.startsWith(selected.dial))) {
        return { iso: selected.iso, national: value.slice(selected.dial.length).replace(/\D/g, '') };
      }
      return splitE164(value, defaultCountry);
    }, [value, selectedIso, defaultCountry]);
    const country = PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0]!;

    const setCountry = (nextIso: string) => {
      const next = PHONE_COUNTRIES.find((c) => c.iso === nextIso) ?? country;
      setSelectedIso(next.iso);
      setValue(`${next.dial}${national}`);
    };
    const setNational = (raw: string) => {
      const digits = raw.replace(/\D/g, '');
      setValue(`${country.dial}${digits}`);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-stretch overflow-hidden rounded-md border bg-background',
          isInvalid ? 'border-destructive' : 'border-input',
          isDisabled && 'opacity-60',
          className,
        )}
        {...rest}
      >
        <select
          aria-label="Country"
          value={iso}
          disabled={isDisabled || isReadOnly}
          onChange={(e) => setCountry(e.target.value)}
          className={cn(
            'h-10 cursor-pointer border-r border-input bg-card pl-2 pr-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          style={{ minWidth: 90 }}
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          placeholder={placeholder}
          disabled={isDisabled}
          readOnly={isReadOnly}
          aria-invalid={isInvalid || undefined}
          onChange={(e) => setNational(e.target.value)}
          className={cn(
            inputBaseVariants({ size: 'md' }),
            'rounded-none border-0 focus-visible:ring-0',
          )}
        />
        {name && <input type="hidden" name={name} value={value} />}
      </div>
    );
  },
);
