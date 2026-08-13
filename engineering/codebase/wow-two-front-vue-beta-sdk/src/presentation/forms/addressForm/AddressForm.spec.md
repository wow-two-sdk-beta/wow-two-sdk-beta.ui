# AddressForm

## Purpose
Country-aware address form. Country picker drives field configuration: state vs province vs region, ZIP vs postal code, label order. Built-in config for US/CA/GB/DE/FR/AU/JP; generic fallback for everything else.

## Anatomy
```
<AddressForm>
  ├── Country select
  ├── Line 1
  ├── Line 2 (optional)
  ├── City + Region (state/province/county) + Postal code (responsive)
</AddressForm>
```

## Required behaviors
- Country change → update region label, postal-code label, region options (US states / CA provinces / etc.).
- Output: `Address` object via `onValueChange`.
- Optional `name` prefix emits `<name>.line1`, `<name>.line2`, etc. as hidden inputs (so it works with native form posts).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `value` / `defaultValue` / `onValueChange` | `Address` | controlled / uncontrolled | |
| `disabled` / `readOnly` | `boolean` | `false` | |
| `compact` | `boolean` | `false` | Stack fields vertically (mobile) |
| `name` | `string` | — | Hidden-input prefix |

## Address shape
```ts
type Address = {
  country: string;     // ISO 3166-1 alpha-2
  line1: string;
  line2?: string;
  city: string;
  region: string;      // state / province / county
  postalCode: string;
};
```

## Accessibility
- All native inputs with `<label>` association.
- Country select first (drives layout of subsequent fields).

## Dependencies
Foundation: `utils`. Same domain: `forms/InputStyles`, `forms/label`.
