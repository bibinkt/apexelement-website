'use client';

import { useState } from 'react';

export default function LoginForm({ base = '' }) {
  const [stage, setStage] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function requestCode(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${base}/api/auth/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not send a code.');
      setStage('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${base}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'That code is not right.');
      window.location.href = `${base}/dashboard`;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={stage === 'phone' ? requestCode : verify} className="loginform">
      {stage === 'phone' ? (
        <>
          <label htmlFor="lphone">Mobile number</label>
          <input
            id="lphone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(407) 555-0110"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <p style={{ marginTop: '20px' }}>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Text me a code'}
            </button>
          </p>
        </>
      ) : (
        <>
          <label htmlFor="lcode">Six-digit code</label>
          <input
            id="lcode"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <p style={{ marginTop: '20px' }}>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </p>
          <p className="hint">
            Sent to {phone}.{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStage('phone');
                setCode('');
                setError(null);
              }}
            >
              Use a different number
            </a>
          </p>
        </>
      )}
      {error && <div className="formmsg err">{error}</div>}
      <p className="hint">
        Easier still: text your FrontlinePros number and we&rsquo;ll send you a link straight back.
      </p>
    </form>
  );
}
