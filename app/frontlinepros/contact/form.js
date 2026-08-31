'use client';

import { useState } from 'react';
import { brand } from '../brand';

const SUPABASE_URL = 'https://uyvkcyupnofxlcmurdjl.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dmtjeXVwbm9meGxjbXVyZGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzU4NjgsImV4cCI6MjA3MDYxMTg2OH0.cb4EWvhx7jTI6U5psy-YMtdcpOr5jZSiataAcJbTR54';

// The exact wording shown beside the opt-in checkbox. Stored verbatim with every
// consent record so we can evidence what the person actually agreed to.
export const CONSENT_TEXT =
  'Text me marketing messages about FrontlinePros. I agree to receive recurring marketing ' +
  'text messages from FrontlinePros (ApexElement LLC) at the mobile number above, sent using ' +
  'automated technology. This consent is for marketing messages only and is separate from any ' +
  'service or account messages. Msg frequency varies, about 2-4 per month. Msg & data rates may ' +
  'apply. Reply STOP to opt out, HELP for help. Consent is not a condition of any purchase. ' +
  'See our Privacy Policy and Messaging Terms.';

export default function ContactForm({ base = '' }) {
  const [status, setStatus] = useState(null); // null | 'ok' | 'err'
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const f = new FormData(e.currentTarget);
    const optedIn = f.get('sms_optin') === 'yes';
    const consent = optedIn
      ? `SMS OPT-IN: YES at ${new Date().toISOString()} for ${f.get('phone') || '(no number given)'}\n` +
        `Consent text shown: "${CONSENT_TEXT}"`
      : 'SMS OPT-IN: NO (checkbox not ticked)';
    const payload = {
      name: f.get('name'),
      email: f.get('email'),
      company: f.get('company') || null,
      phone: f.get('phone') || null,
      message:
        `[${brand.NAME}] Trade: ${f.get('trade') || '—'} | Calls/week missed: ` +
        `${f.get('missed') || '—'}\n${consent}\n\n${f.get('message') || ''}`,
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

          <label htmlFor="phone">Mobile number</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />

          <label htmlFor="missed">Roughly how many calls a week do you miss?</label>
          <input id="missed" name="missed" placeholder="A guess is fine" />

          <label htmlFor="message">Anything else</label>
          <textarea id="message" name="message" />

          <div className="optin">
            <label className="optin-row" htmlFor="sms_optin">
              <input type="checkbox" id="sms_optin" name="sms_optin" value="yes" />
              <span className="optin-text">
                <b>Text me marketing messages about {brand.NAME}.</b> I agree to receive recurring
                marketing text messages from {brand.NAME} ({brand.LEGAL_ENTITY}) at the mobile
                number above, sent using automated technology. This consent is for marketing
                messages only and is separate from any service or account messages. Msg frequency
                varies, about 2&ndash;4 per month. Msg &amp; data rates may apply. Reply STOP to
                opt out, HELP for help. Consent is not a condition of any purchase. See our{' '}
                <a href={`${base}/privacy`}>Privacy Policy</a> and{' '}
                <a href={`${base}/messaging-terms`}>Messaging Terms</a>.
              </span>
            </label>
            <p className="optin-note">
              Ticking this is optional. Leave it unticked and we&rsquo;ll only email you.
            </p>
          </div>

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
              <a href={`mailto:${brand.EMAIL}`}>{brand.EMAIL}</a>.
            </div>
          )}
          <p className="hint">
            We use what you send here to reply to you about {brand.NAME}. Nothing else. See our{' '}
            <a href={`${base}/privacy`}>Privacy Policy</a>.
          </p>
        </form>

        <p className="hint">
          Or email <a href={`mailto:${brand.EMAIL}`}>{brand.EMAIL}</a> directly.
        </p>
    </>
  );
}
