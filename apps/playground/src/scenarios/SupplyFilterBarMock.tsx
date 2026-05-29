import { useState } from 'react';
import { Select } from '@wow-two-beta/ui/forms';

/* Mimics haven's filter-bar shape so we can iterate on Select/MultiSelect/etc.
   against the same layout + tone palette without the push/pull cycle. */

type Contact = 'unresolved' | 'owner' | 'realtor' | 'agency' | 'developer';
type ListingType = 'rent' | 'sale' | 'rent-or-sale' | 'exchange';

const contactOptions = [
  { itemKey: 'unresolved' as Contact, label: 'Unresolved', meta: 0 },
  { itemKey: 'owner' as Contact, label: 'Owner', meta: 240 },
  { itemKey: 'realtor' as Contact, label: 'Realtor', meta: 471 },
  { itemKey: 'agency' as Contact, label: 'Agency', meta: 292 },
  { itemKey: 'developer' as Contact, label: 'Developer', meta: 1 },
];

const listingTypeOptions = [
  { itemKey: 'rent' as ListingType, label: 'Rent', meta: 1004 },
  { itemKey: 'sale' as ListingType, label: 'Sale', meta: 2587 },
  { itemKey: 'rent-or-sale' as ListingType, label: 'Rent or Sale', meta: 2 },
  { itemKey: 'exchange' as ListingType, label: 'Exchange', meta: 1 },
];

const roomOptions = [1, 2, 3, 4, 5].map((n) => ({
  itemKey: n,
  label: `${n}R`,
  meta: 100 + n * 10,
}));

/** Provides a haven-style filter bar mockup for sandbox iteration on Select. */
export function SupplyFilterBarMock() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [listingType, setListingType] = useState<ListingType | null>(null);
  const [rooms, setRooms] = useState<number | null>(null);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-4 gap-4">
        <FilterField label="Contact">
          <Select<Contact>
            selected={contact}
            onChange={(opt) => setContact(opt?.itemKey ?? null)}
            clearable
          >
            <Select.Trigger size="xs" className="w-40">
              <Select.Value placeholder="All" />
            </Select.Trigger>
            <Select.Content>
              {contactOptions.map((opt) => (
                <Select.Item<Contact>
                  key={opt.itemKey}
                  itemKey={opt.itemKey}
                  label={opt.label}
                  disabled={opt.meta === 0}
                >
                  <span className="flex-1">{opt.label}</span>
                  <span className="ml-2 text-xs text-subtle-foreground">{opt.meta}</span>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </FilterField>

        <FilterField label="Type">
          <Select<ListingType>
            selected={listingType}
            onChange={(opt) => setListingType(opt?.itemKey ?? null)}
            clearable
          >
            <Select.Trigger size="xs" className="w-40">
              <Select.Value placeholder="All" />
            </Select.Trigger>
            <Select.Content>
              {listingTypeOptions.map((opt) => (
                <Select.Item<ListingType>
                  key={opt.itemKey}
                  itemKey={opt.itemKey}
                  label={opt.label}
                >
                  <span className="flex-1">{opt.label}</span>
                  <span className="ml-2 text-xs text-subtle-foreground">{opt.meta}</span>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </FilterField>

        <FilterField label="Rooms">
          <Select<number>
            selected={rooms}
            onChange={(opt) => setRooms(opt?.itemKey ?? null)}
            clearable
          >
            <Select.Trigger size="xs" className="w-40">
              <Select.Value placeholder="All" />
            </Select.Trigger>
            <Select.Content>
              {roomOptions.map((opt) => (
                <Select.Item<number> key={opt.itemKey} itemKey={opt.itemKey} label={opt.label}>
                  <span className="flex-1">{opt.label}</span>
                  <span className="ml-2 text-xs text-subtle-foreground">{opt.meta}</span>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </FilterField>

        <div className="rounded-md border border-border bg-popover p-3 text-xs">
          <div className="font-medium text-foreground">State</div>
          <pre className="mt-1 text-subtle-foreground">
{JSON.stringify({ contact, listingType, rooms }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
