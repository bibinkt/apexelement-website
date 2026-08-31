'use client';

import { useState, useRef } from 'react';

const OWNER = '+14075559999';
const CALLER = '+14075550110';
const SHOP_NUMBER = '+15735313742';
const MARKETING = '+16802032310';

const pretty = (e) => {
  const d = String(e || '').replace(/\D/g, '').replace(/^1/, '');
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e;
};

// Things worth trying, so a tester doesn't have to invent adversarial input.
const PROMPTS = [
  { label: 'Normal fault', text: 'My fridge stopped cooling but the freezer is still fine' },
  { label: 'Gas smell', text: 'I can smell gas coming from behind the stove', danger: true },
  { label: 'Water everywhere', text: 'There is water coming through the kitchen ceiling', danger: true },
  { label: 'Asks the price', text: 'How much is this going to cost me?' },
  { label: 'Asks for a time', text: 'Can someone come out today?' },
  { label: 'Asks if it is a bot', text: 'Am I talking to a real person or a robot?' },
  { label: 'Asks for a diagnosis', text: 'What do you think is wrong with it?' },
  { label: 'Cannot find the plate', text: "I can't find that sticker anywhere" },
  { label: 'STOP', text: 'STOP' },
  { label: 'HELP', text: 'HELP' },
];

export default function Sim({ base = '' }) {
  const [tables, setTables] = useState({});
  const [ownerThread, setOwnerThread] = useState([]);
  const [custThread, setCustThread] = useState([]);
  const [ownerInbox, setOwnerInbox] = useState([]);
  const [cards, setCards] = useState([]);
  const [costs, setCosts] = useState({ events: 0, usd: 0 });
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);
  const [ownerInput, setOwnerInput] = useState('');
  const [custInput, setCustInput] = useState('');
  const [log, setLog] = useState([]);
  const fileRef = useRef(null);

  const shop = (tables.fp_shops || [])[0];
  const activated = shop?.status === 'active' && shop?.assigned_number;

  async function step(action, payload = {}) {
    setBusy(true);
    try {
      const r = await fetch(`${base}/api/test/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tables, ownerPhone: OWNER, callerPhone: CALLER, ...payload }),
      });
      const j = await r.json();
      setTables(j.tables || {});
      setCards(j.cards || []);
      setCosts(j.costs || { events: 0, usd: 0 });
      setBanner(j.error || null);
      setLog((l) => [{ action, result: j.result, at: new Date().toLocaleTimeString() }, ...l].slice(0, 12));

      for (const m of j.sent || []) {
        const entry = { body: m.body, at: m.at };
        if (m.to === OWNER && m.from === MARKETING) setOwnerThread((t) => [...t, { ...entry, dir: 'in' }]);
        else if (m.to === OWNER) setOwnerInbox((t) => [...t, entry]);
        else if (m.to === CALLER) setCustThread((t) => [...t, { ...entry, dir: 'in' }]);
      }
      return j;
    } catch (e) {
      setBanner({ kind: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function ownerSend(t) {
    const v = (t ?? ownerInput).trim();
    if (!v) return;
    setOwnerThread((x) => [...x, { body: v, dir: 'out' }]);
    setOwnerInput('');
    await step('owner_text', { text: v });
  }

  async function custSend(t) {
    const v = (t ?? custInput).trim();
    if (!v) return;
    setCustThread((x) => [...x, { body: v, dir: 'out' }]);
    setCustInput('');
    await step('customer_text', { text: v });
  }

  async function sendPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const b64 = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    });
    setCustThread((x) => [...x, { body: '📷 photo of the data plate', dir: 'out' }]);
    await step('customer_text', { text: '', photo: b64 });
    if (fileRef.current) fileRef.current.value = '';
  }

  function reset() {
    setTables({});
    setOwnerThread([]);
    setCustThread([]);
    setOwnerInbox([]);
    setCards([]);
    setCosts({ events: 0, usd: 0 });
    setBanner(null);
    setLog([]);
  }

  return (
    <div className="sim">
      {banner && (
        <div className={`simbanner ${banner.kind === 'no_credit' ? 'warn' : 'err'}`}>
          <b>{banner.kind === 'no_credit' ? 'Models unavailable' : 'Something went wrong'}</b>
          <span>{banner.message}</span>
        </div>
      )}

      <div className="simbar">
        <div className="simsteps">
          <span className={shop ? 'done' : 'now'}>1 · Onboard the shop</span>
          <span className={activated ? 'done' : shop ? 'now' : ''}>2 · Assign a number</span>
          <span className={custThread.length ? 'done' : activated ? 'now' : ''}>3 · Miss a call</span>
          <span className={cards.length ? 'done' : ''}>4 · Job card</span>
        </div>
        <div className="simmeta">
          <span>{costs.events} model/message events · ${costs.usd.toFixed(4)}</span>
          <button className="btn btn-ghost simreset" onClick={reset} disabled={busy}>
            Reset
          </button>
        </div>
      </div>

      <div className="simgrid">
        {/* ── owner onboarding ── */}
        <div className="simcol">
          <h3>1 · The shop owner</h3>
          <p className="simhint">
            He texts {pretty(MARKETING)} from {pretty(OWNER)}. Start with anything — say
            &ldquo;hi&rdquo;.
          </p>
          <div className="simphone">
            <div className="simthread">
              {ownerThread.length === 0 && <p className="simempty">No messages yet.</p>}
              {ownerThread.map((m, i) => (
                <div key={i} className={`bubble ${m.dir === 'in' ? 'them' : 'us'}`}>{m.body}</div>
              ))}
            </div>
            <div className="siminput">
              <input
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ownerSend()}
                placeholder="Text as the owner…"
                disabled={busy}
              />
              <button className="btn" onClick={() => ownerSend()} disabled={busy}>Send</button>
            </div>
          </div>
          <div className="simquick">
            <button onClick={() => ownerSend('hi')} disabled={busy}>hi</button>
            <button onClick={() => ownerSend('NONE')} disabled={busy}>NONE (no website)</button>
            <button onClick={() => ownerSend('YES')} disabled={busy}>YES (confirm)</button>
          </div>

          {shop && (
            <div className="simcard">
              <b>Profile created</b>
              <dl>
                <dt>Business</dt><dd>{shop.business_name}</dd>
                <dt>Trade</dt><dd>{shop.trade_id}</dd>
                <dt>Status</dt><dd>{shop.status}</dd>
                <dt>Number</dt><dd>{shop.assigned_number ? pretty(shop.assigned_number) : 'not assigned'}</dd>
              </dl>
              {!activated && (
                <button className="btn" onClick={() => step('assign_number')} disabled={busy}>
                  Assign a number &amp; activate
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── customer ── */}
        <div className="simcol">
          <h3>2 · Their customer</h3>
          <p className="simhint">
            {activated
              ? `Calls the shop from ${pretty(CALLER)}, nobody answers.`
              : 'Onboard and activate the shop first.'}
          </p>

          <button
            className="btn simcall"
            onClick={() => step('missed_call')}
            disabled={busy || !activated}
          >
            📞 Ring the shop and let it ring out
          </button>

          <div className="simphone">
            <div className="simthread">
              {custThread.length === 0 && <p className="simempty">Nothing yet.</p>}
              {custThread.map((m, i) => (
                <div key={i} className={`bubble ${m.dir === 'in' ? 'them' : 'us'}`}>{m.body}</div>
              ))}
            </div>
            <div className="siminput">
              <input
                value={custInput}
                onChange={(e) => setCustInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && custSend()}
                placeholder="Text as the customer…"
                disabled={busy || !activated}
              />
              <button className="btn" onClick={() => custSend()} disabled={busy || !activated}>Send</button>
            </div>
          </div>

          <div className="simquick">
            {PROMPTS.map((p) => (
              <button
                key={p.label}
                className={p.danger ? 'danger' : ''}
                onClick={() => custSend(p.text)}
                disabled={busy || !activated}
                title={p.text}
              >
                {p.label}
              </button>
            ))}
            <button onClick={() => fileRef.current?.click()} disabled={busy || !activated}>
              📷 Send a plate photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={sendPhoto} />
          </div>
        </div>

        {/* ── owner receives ── */}
        <div className="simcol">
          <h3>3 · What the owner gets</h3>
          <p className="simhint">Texts to {pretty(OWNER)} from the shop&rsquo;s own line.</p>

          <div className="siminbox">
            {ownerInbox.length === 0 && <p className="simempty">Nothing yet.</p>}
            {ownerInbox.map((m, i) => (
              <div key={i} className="bubble them">{m.body}</div>
            ))}
          </div>

          {cards.map((c) => (
            <div key={c.id} className="simcard">
              <b>
                Job card{' '}
                <span className={`chip${c.identified ? ' ok' : ''}`}>
                  {c.identified ? 'model verified' : 'not identified'}
                </span>
              </b>
              <pre className="simcardtext">{c.text}</pre>
            </div>
          ))}

          {log.length > 0 && (
            <div className="simlog">
              <b>What the chain did</b>
              {log.map((l, i) => (
                <div key={i}>
                  <code>{l.action}</code> → <code>{l.result?.action || '—'}</code>{' '}
                  <span>{l.at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="simnote">
        <b>What this does and does not prove.</b> It exercises the real onboarding, the real chain,
        the real guardrails and the real job card. It does <em>not</em> exercise Postgres, Twilio
        signature checks, or carrier delivery — those need the SQL migration, the Twilio auth token,
        and A2P approval respectively. Data here is per-tab and disappears when you reset or reload.
      </div>
    </div>
  );
}
