// What "a complete profile" means, in one place so the dashboard nudge and the
// chain agree. Everything here is optional — the point is to show the owner
// what the assistant could be doing better with, not to block them.

export const FIELDS = [
  { key: 'service_area',   label: 'Area you cover',      why: 'Lets it screen out jobs too far to be worth the drive.' },
  { key: 'hours',          label: 'Working hours',       why: 'So it knows when a call is genuinely out of hours.' },
  { key: 'days',           label: 'Working days',        why: 'Same — it stops treating Sunday like a weekday.' },
  { key: 'boundaries',     label: 'What you won’t take', why: 'Commercial work, rentals, jobs you always turn down.' },
  { key: 'brands_avoided', label: 'Brands you avoid',    why: 'It can flag them before you drive out.' },
  { key: 'owner_email',    label: 'Email',               why: 'A second place your job cards land.' },
  { key: 'address',        label: 'Shop address',        why: 'Used for distance, never shown to a customer.' },
  { key: 'notes',          label: 'Anything else',       why: 'Whatever you would tell a new receptionist.' },
];

export function completion(shop = {}) {
  const done = FIELDS.filter((f) => {
    const v = shop[f.key];
    return typeof v === 'string' ? v.trim().length > 0 : !!v;
  });
  return {
    done: done.length,
    total: FIELDS.length,
    pct: Math.round((done.length / FIELDS.length) * 100),
    missing: FIELDS.filter((f) => !done.includes(f)),
  };
}
