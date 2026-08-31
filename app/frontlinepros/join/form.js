'use client';

import { useState } from 'react';

const TRADES = [
  { id: 'appliance', label: 'Appliance repair' },
  { id: 'hvac', label: 'HVAC and cooling' },
  { id: 'plumbing', label: 'Plumbing' },
];

export default function JoinForm({ base = '', phone = '' }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${base}/api/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f)),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Could not save that.');
      setDone(true);
      setTimeout(() => (window.location.href = `${base}/dashboard`), 1200);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="formmsg ok">
        You&rsquo;re set up. Taking you to your dashboard&hellip;
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="business_name">Business name</label>
      <input id="business_name" name="business_name" required placeholder="Ace Appliance" />

      <label htmlFor="trade_id">Trade</label>
      <select id="trade_id" name="trade_id" defaultValue="appliance">
        {TRADES.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>

      <label htmlFor="phone">Your mobile number</label>
      <input id="phone" name="phone" type="tel" defaultValue={phone} required
             placeholder="(407) 555-0110" />

      <label htmlFor="owner_name">Your name</label>
      <input id="owner_name" name="owner_name" placeholder="Tom" />

      <label htmlFor="service_area">Area you cover</label>
      <input id="service_area" name="service_area" placeholder="Orlando and east" />

      <label htmlFor="owner_email">Email (optional)</label>
      <input id="owner_email" name="owner_email" type="email" />

      <p style={{ marginTop: '22px' }}>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Finish setup'}
        </button>
      </p>
      {error && <div className="formmsg err">{error}</div>}
      <p className="hint">
        We&rsquo;ll text your forwarding code to the mobile number above.
      </p>
    </form>
  );
}
