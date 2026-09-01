'use client';
import { useState } from 'react';

export default function AdminLogin({ base = '' }) {
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function post(body) {
    const r = await fetch(`${base}/api/admin/auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || 'That did not work.');
    return j;
  }

  return (
    <form className="loginform" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError(null);
      try {
        if (stage === 'email') { await post({ action: 'code', email }); setStage('code'); }
        else { await post({ action: 'verify', email, code }); window.location.href = `${base}/admin`; return; }
      } catch (err) { setError(err.message); } finally { setBusy(false); }
    }}>
      {stage === 'email' ? (
        <>
          <label htmlFor="ae">Admin email</label>
          <input id="ae" type="email" autoComplete="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} placeholder="you@apexelement.ai" required />
          <p style={{ marginTop: '20px' }}>
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
          </p>
        </>
      ) : (
        <>
          <label htmlFor="ac">Six-digit code</label>
          <input id="ac" className="codeinput" inputMode="numeric" maxLength={6} value={code}
                 onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          <p style={{ marginTop: '20px' }}>
            <button className="btn" type="submit" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </p>
          <p className="hint">Sent to {email}. Codes last ten minutes.</p>
        </>
      )}
      {error && <div className="formmsg err">{error}</div>}
      <p className="hint">Admin sessions last eight hours — this one can change pricing.</p>
    </form>
  );
}
