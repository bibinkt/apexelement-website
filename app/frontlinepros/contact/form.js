'use client';

import { useState } from 'react';
import { brand } from '../brand';

const SUPABASE_URL = 'https://uyvkcyupnofxlcmurdjl.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dmtjeXVwbm9meGxjbXVyZGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzU4NjgsImV4cCI6MjA3MDYxMTg2OH0.cb4EWvhx7jTI6U5psy-YMtdcpOr5jZSiataAcJbTR54';

export default function ContactForm({ base = '' }) {
  const [status, setStatus] = useState(null); // null | 'ok' | 'err'
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const f = new FormData(e.currentTarget);
    const payload = {
      name: f.get('name'),
      email: f.get('email'),
      company: f.get('company') || null,
      phone: f.get('phone') || null,
      message:
        `[${brand.NAME}] Trade: ${f.get('trade') || '—'} | Calls/week missed: ` +
        `${f.get('missed') || '—'}\n\n${f.get('message') || ''}`,
    };
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('submit failed');
      setStatus('ok');
      e.target.reset();
    } catch {
      setStatus('err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="shell narrow doc">
        <h1>Talk to us</h1>
        <p className="dates">
          We&rsquo;re taking five shops in Florida as founding members. Free for life.
        </p>
        <p>
          Tell us what you run and roughly how many calls a week go unanswered. We&rsquo;ll call you
          back &mdash; a real person, ten minutes, no presentation.
        </p>

        <form onSubmit={onSubmit}>
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" required autoComplete="name" />

          <label htmlFor="company">Shop name</label>
          <input id="company" name="company" autoComplete="organization" />

          <label htmlFor="trade">Trade</label>
          <select id="trade" name="trade" defaultValue="">
            <option value="">Select…</option>
            <option>Appliance repair</option>
            <option>HVAC</option>
            <option>Plumbing</option>
            <option>More than one of these</option>
            <option>Other</option>
          </select>

          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />

          <label htmlFor="missed">Roughly how many calls a week do you miss?</label>
          <input id="missed" name="missed" placeholder="A guess is fine" />

          <label htmlFor="message">Anything else</label>
          <textarea id="message" name="message" />

          <p style={{ marginTop: '22px' }}>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send'}
            </button>
          </p>

          {status === 'ok' && (
            <div className="formmsg ok">
              Got it. We&rsquo;ll be in touch within one business day.
            </div>
          )}
          {status === 'err' && (
            <div className="formmsg err">
              That didn&rsquo;t send. Email us directly at{' '}
              <a href={`mailto:${brand.EMAIL_SUPPORT}`}>{brand.EMAIL_SUPPORT}</a>.
            </div>
          )}
          <p className="hint">
            We use what you send here to reply to you about {brand.NAME}. Nothing else. See our{' '}
            <a href={`${base}/privacy`}>Privacy Policy</a>.
          </p>
        </form>

        <h2>Direct</h2>
        <p>
          <strong>{brand.LEGAL_ENTITY}</strong>
          <br />
          {brand.ADDRESS}
          <br />
          <a href={`mailto:${brand.EMAIL_SUPPORT}`}>{brand.EMAIL_SUPPORT}</a> &middot;{' '}
          {brand.PHONE}
        </p>
        <p>
          Privacy requests: <a href={`mailto:${brand.EMAIL_PRIVACY}`}>{brand.EMAIL_PRIVACY}</a>
        </p>
      </div>
    </>
  );
}
