# PhoneInput

## Purpose
International phone input. Country dial-code dropdown + national-number text input. Output: E.164-shaped string (`+<country><number>`). First-gen ships a hand-curated country list; full `libphonenumber` formatting/validation is deferred to a follow-up.

## Anatomy
```
<PhoneInput>
  ├── country select (with dial code, flag emoji)
  └── number input
</PhoneInput>
```

## Required behaviors
- Country selection updates the dial-code prefix.
- Number input strips non-digits.
- `value` is the full E.164 string. Internally tracks country + national number.
- On country change, national number stays.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `string` (E.164) | controlled / uncontrolled | |
| `defaultCountry` | ISO-2 code | `'US'` | |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `invalid` | `boolean` | `false` | |
| `placeholder` | `string` | `'(555) 555-5555'` | |
| `name` | `string` | — | Hidden input emits E.164 |

## Accessibility
- Native `<select>` for country (labeled "Country").
- Native `<input type="tel">` for number.
- Composite role: surrounding container labeled by external `<label>` consumer attaches.

## Dependencies
Foundation: `utils`. Same domain: `forms/InputStyles`.

## Known limitations (deferred)
- No per-country format mask (e.g. US grouping `(555) 555-5555`).
- No length validation.
- Country list is ~50 most-common; not exhaustive.
- No `libphonenumber` integration.
