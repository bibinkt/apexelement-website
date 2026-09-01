'use client';

import { useState } from 'react';

export default function SubscribeButton({ base = '', signedIn, subscribed, billingOn }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (subscribed) {
    return <a href={`${base}/dashboard`} className="btn">Go to your jobs</a>;
  }

  // Not signed in: send them to sign in, then straight back here.
  if (!signedIn) {
    return (
      <a href={`${base}/login?next=/subscribe`} className="btn">
        Sign in to subscribe
      </a>
    );
  }

  async function go() {
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${base}/api/billing/checkout`, { method: 'POST' });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Could not start checkout.');
      window.location.href = j.url;
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <>
      <button className="btn" onClick={go} disabled={busy || !billingOn}>
        {busy ? 'Taking you to checkout…' : 'Subscribe'}
      </button>
      {!billingOn && (
        <p className="plan-fine" style={{ textAlign: 'left', marginTop: '12px' }}>
          Card payments aren’t switched on yet. Ring us and we’ll get you started by hand.
        </p>
      )}
      {error && <div className="formmsg err">{error}</div>}
    </>
  );
}
