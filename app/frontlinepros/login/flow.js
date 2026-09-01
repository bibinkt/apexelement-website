'use client';

import { useState, useRef, useEffect } from 'react';

export default function LoginFlow({ base = '', next = '/dashboard' }) {
  const [stage, setStage] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [resentAt, setResentAt] = useState(null);
  const field = useRef(null);

  useEffect(() => { field.current?.focus(); }, [stage]);

  // Digits only, formatted as they type. The +1 is fixed and shown, never typed.
  const onPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    const out = d.length > 6 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
              : d.length > 3 ? `(${d.slice(0,3)}) ${d.slice(3)}`
              : d;
    setPhone(out);
  };
  const digits = phone.replace(/\D/g, '');

  async function send(e) {
    e?.preventDefault();
    if (digits.length !== 10) return setError('That needs to be a 10-digit mobile number.');
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${base}/api/auth/code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+1${digits}` }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Could not send a code.');
      setStage('code'); setResentAt(Date.now());
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function verify(e) {
    e?.preventDefault();
    if (code.replace(/\D/g, '').length !== 6) return setError('Enter the six digits we texted you.');
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${base}/api/auth/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+1${digits}`, code }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'That code is not right.');
      window.location.href = `${base}${next}`;
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <form onSubmit={stage === 'phone' ? send : verify} className="loginform">
      {stage === 'phone' ? (
        <>
          <label htmlFor="lp">Mobile number</label>
          <div className="phonewrap">
            <span className="phoneprefix">+1</span>
            <input id="lp" ref={field} type="tel" inputMode="numeric" autoComplete="tel-national"
                   value={phone} onChange={(e) => onPhone(e.target.value)}
                   placeholder="(813) 555-0110" className="phoneinput" />
          </div>
          <p style={{ marginTop: '20px' }}>
            <button className="btn" type="submit" disabled={busy || digits.length !== 10}>
              {busy ? 'Sending…' : 'Text me a code'}
            </button>
          </p>
        </>
      ) : (
        <>
          <label htmlFor="lc">Six-digit code</label>
          <input id="lc" ref={field} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                 value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                 placeholder="000000" className="codeinput" />
          <p style={{ marginTop: '20px' }}>
            <button className="btn" type="submit" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </p>
          <p className="hint">
            Sent to +1 {phone}.{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setStage('phone'); setCode(''); setError(null); }}>
              Change number
            </a>
            {resentAt && (
              <>
                {' · '}
                <a href="#" onClick={(e) => { e.preventDefault(); send(); }}>Resend</a>
              </>
            )}
          </p>
        </>
      )}
      {error && <div className="formmsg err">{error}</div>}
      <p className="hint">
        Codes last ten minutes. If you texted us from this phone, the link we sent signs you in
        with one tap instead.
      </p>
    </form>
  );
}
