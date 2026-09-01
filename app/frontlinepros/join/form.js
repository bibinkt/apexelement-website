'use client';

import { useState, useEffect, useRef } from 'react';

const TRADES = [
  { id: 'appliance', label: 'Appliance repair', hint: 'Fridges, washers, dryers, ovens' },
  { id: 'hvac', label: 'HVAC & cooling', hint: 'AC, heat pumps, furnaces' },
  { id: 'plumbing', label: 'Plumbing', hint: 'Water heaters, drains, fixtures' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// One decision per screen. Everything after the first two is optional, and the
// step says so, because a shop owner filling this in a van will abandon a wall
// of fields.
const STEPS = [
  { id: 'name', title: "What's the shop called?", sub: 'This is the name your customer sees in the text.', required: true },
  { id: 'trade', title: 'What do you fix?', sub: 'It changes the questions we ask your customers.', required: true },
  { id: 'phone', title: 'Your mobile number', sub: 'Where your job cards land. We text your setup code here too.', required: true },
  { id: 'area', title: 'Where do you work?', sub: 'Optional — helps us screen out jobs too far to be worth the drive.' },
  { id: 'hours', title: 'When are you working?', sub: 'Optional — so we know when a call is genuinely out of hours.' },
  { id: 'extras', title: 'Anything else?', sub: 'All optional. Skip the lot if you like.' },
];

export default function JoinForm({ base = '', phone = '' }) {
  const [i, setI] = useState(0);
  const [data, setData] = useState({
    business_name: '', trade_id: '', phone, owner_name: '',
    service_area: '', address: '', hours: '', days: [],
    emergency: false, owner_email: '', notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const firstField = useRef(null);

  const step = STEPS[i];
  const pct = Math.round(((i + (done ? 1 : 0)) / STEPS.length) * 100);

  useEffect(() => { firstField.current?.focus(); }, [i]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const toggleDay = (d) =>
    setData((s) => ({ ...s, days: s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d] }));

  function valid() {
    if (step.id === 'name') return data.business_name.trim().length > 1;
    if (step.id === 'trade') return !!data.trade_id;
    if (step.id === 'phone') return data.phone.replace(/\D/g, '').length >= 10;
    return true;
  }

  function next() {
    if (!valid()) {
      setError(
        step.id === 'phone'
          ? 'We need a mobile number that can receive texts.'
          : 'Just this one and you can move on.'
      );
      return;
    }
    setError(null);
    if (i < STEPS.length - 1) setI(i + 1);
    else submit();
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${base}/api/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, days: data.days.join(',') }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Could not save that.');
      setResult(j);
      setDone(true);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="wiz">
        <div className="wiz-bar"><div className="wiz-fill" style={{ width: '100%' }} /></div>
        <div className="wiz-done">
          <div className="wiz-tick">✓</div>
          <h2>
            {result?.existing ? 'That number is already set up.' : `${data.business_name} is set up.`}
          </h2>
          <p>
            {result?.existing
              ? `We've texted a sign-in link to ${data.phone}.`
              : `Check ${data.phone} — we've sent your forwarding code and a link to your jobs.`}
          </p>
          <p className="wiz-why">
            We sign you in by text rather than straight away, so nobody can reach your jobs by
            typing your number into this form.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wiz">
      <div className="wiz-bar"><div className="wiz-fill" style={{ width: `${pct}%` }} /></div>
      <p className="wiz-count">
        Step {i + 1} of {STEPS.length}
        {!step.required && <span className="wiz-opt">optional</span>}
      </p>

      <div className="wiz-step" key={step.id}>
        <h2>{step.title}</h2>
        <p className="wiz-sub">{step.sub}</p>

        {step.id === 'name' && (
          <input ref={firstField} className="wiz-input" value={data.business_name}
                 onChange={(e) => set('business_name', e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && next()}
                 placeholder="Ace Appliance" autoComplete="organization" />
        )}

        {step.id === 'trade' && (
          <div className="wiz-choices">
            {TRADES.map((t) => (
              <button key={t.id} type="button"
                className={`wiz-choice${data.trade_id === t.id ? ' on' : ''}`}
                onClick={() => { set('trade_id', t.id); setTimeout(next, 180); }}>
                <b>{t.label}</b><span>{t.hint}</span>
              </button>
            ))}
          </div>
        )}

        {step.id === 'phone' && (
          <>
            <input ref={firstField} className="wiz-input" type="tel" inputMode="tel"
                   value={data.phone} onChange={(e) => set('phone', e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && next()}
                   placeholder="(813) 555-0110" autoComplete="tel" />
            <label className="wiz-label">Your name</label>
            <input className="wiz-input" value={data.owner_name}
                   onChange={(e) => set('owner_name', e.target.value)}
                   placeholder="Optional" autoComplete="given-name" />
          </>
        )}

        {step.id === 'area' && (
          <>
            <input ref={firstField} className="wiz-input" value={data.service_area}
                   onChange={(e) => set('service_area', e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && next()}
                   placeholder="Tampa and 20 miles east" />
            <label className="wiz-label">Shop address</label>
            <input className="wiz-input" value={data.address}
                   onChange={(e) => set('address', e.target.value)}
                   placeholder="Optional" autoComplete="street-address" />
          </>
        )}

        {step.id === 'hours' && (
          <>
            <div className="wiz-days">
              {DAYS.map((d) => (
                <button key={d} type="button"
                  className={`wiz-day${data.days.includes(d) ? ' on' : ''}`}
                  onClick={() => toggleDay(d)}>{d}</button>
              ))}
            </div>
            <label className="wiz-label">Usual hours</label>
            <input className="wiz-input" value={data.hours}
                   onChange={(e) => set('hours', e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && next()}
                   placeholder="8am – 6pm" />
            <label className="wiz-check">
              <input type="checkbox" checked={data.emergency}
                     onChange={(e) => set('emergency', e.target.checked)} />
              <span>I take emergency call-outs after hours</span>
            </label>
          </>
        )}

        {step.id === 'extras' && (
          <>
            <label className="wiz-label">Email</label>
            <input ref={firstField} className="wiz-input" type="email" value={data.owner_email}
                   onChange={(e) => set('owner_email', e.target.value)}
                   placeholder="Optional — for job cards by email too" autoComplete="email" />
            <label className="wiz-label">Anything we should know?</label>
            <textarea className="wiz-input wiz-area" value={data.notes}
                      onChange={(e) => set('notes', e.target.value)}
                      placeholder="Brands you don't touch, jobs you won't take, anything else" />
          </>
        )}

        {error && <div className="formmsg err">{error}</div>}

        <div className="wiz-nav">
          {i > 0 && (
            <button type="button" className="wiz-back" onClick={() => { setError(null); setI(i - 1); }}>
              &larr; Back
            </button>
          )}
          <button type="button" className="btn wiz-next" onClick={next} disabled={busy}>
            {busy ? 'Setting up…' : i === STEPS.length - 1 ? 'Finish setup' : 'Continue'}
          </button>
          {!step.required && i < STEPS.length - 1 && (
            <button type="button" className="wiz-skip" onClick={() => setI(i + 1)}>Skip</button>
          )}
        </div>
      </div>
    </div>
  );
}
