import { cookies } from 'next/headers';
import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import { adminForSession, ADMIN_COOKIE } from '../../../lib/fp/admin';
import { getSetting, PROTECTED } from '../../../lib/fp/settings';
import { select } from '../../../lib/fp/db';
import { prettyPhone } from '../../../lib/fp/twilio';
import { configured } from '../../../lib/fp/billing';
import AdminLogin from './login';
import AdminPanels from './panels';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

const DAY = 864e5;

export default async function AdminPage() {
  const base = productBase();
  const admin = await adminForSession(cookies().get(ADMIN_COOKIE)?.value);

  if (!admin) {
    return (
      <>
        <Mast />
        <section className="dashsec">
          <div className="shell narrow">
            <div className="kicker">FrontlinePros</div>
            <h1 className="dash-h1">Admin</h1>
            <p className="lede" style={{ maxWidth: '44ch' }}>
              Sign in with an admin email. We&rsquo;ll send a six-digit code.
            </p>
            <AdminLogin base={base} />
          </div>
        </section>
        <Foot />
      </>
    );
  }

  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const [shops, conversations, cards, costs, optouts, messages] = await Promise.all([
    select('fp_shops', 'order=created_at.desc'),
    select('fp_conversations', `started_at=gte.${since}&order=started_at.desc`),
    select('fp_jobcards', `created_at=gte.${since}&order=created_at.desc`),
    select('fp_costs', `created_at=gte.${since}`),
    select('fp_optouts', ''),
    select('fp_messages', `created_at=gte.${since}`),
  ]);

  const pricing = await getSetting('pricing');
  const guardrails = await getSetting('guardrails');

  const active = shops.filter((s) => s.status === 'active');
  const paying = shops.filter((s) =>
    ['active', 'trialing', 'cancelling'].includes(s.subscription_status)
  );
  const spend = costs.reduce((a, r) => a + Number(r.usd || 0), 0);
  const carded = cards.length;
  const hazards = conversations.filter((c) => c.hazard).length;
  const blocked = messages.filter((m) => m.blocked);

  // Which guard rail fires most — the thing worth knowing when tuning them.
  const byViolation = {};
  for (const m of blocked) byViolation[m.violation || 'unknown'] = (byViolation[m.violation || 'unknown'] || 0) + 1;
  const violations = Object.entries(byViolation).sort((a, b) => b[1] - a[1]);

  const mrr = paying.length * Number(pricing.monthly_usd || 0);
  const margin = mrr - spend;

  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell">
          <div className="adminbar">
            <div>
              <div className="kicker">Admin</div>
              <h1 className="dash-h1" style={{ marginBottom: 0 }}>Everything, everywhere</h1>
              <p className="dash-sub" style={{ marginBottom: 0 }}>
                Signed in as {admin.email} &middot; last 30 days
                {!configured() && ' · Stripe not configured'}
              </p>
            </div>
            <form action={`${base}/api/admin/auth`} method="post">
              <a className="btn btn-ghost adminlogout" href={`${base}/admin?logout=1`}>Sign out</a>
            </form>
          </div>

          <div className="tiles">
            <div className="tile"><b>{shops.length}</b><span>Shops</span><em>{active.length} active</em></div>
            <div className="tile accent"><b>{paying.length}</b><span>Paying</span><em>${mrr.toFixed(0)} MRR</em></div>
            <div className="tile"><b>{conversations.length}</b><span>Calls caught</span><em>{carded} became job cards</em></div>
            <div className="tile"><b>${spend.toFixed(2)}</b><span>Cost, 30 days</span><em>${margin.toFixed(0)} gross</em></div>
          </div>

          <div className="dash-grid">
            <div className="panel">
              <h3>Where the money is</h3>
              <table className="cardtable">
                <tbody>
                  <tr><th>Paying shops</th><td>{paying.length}</td><td className="prov" /></tr>
                  <tr><th>Monthly price</th><td>${Number(pricing.monthly_usd).toFixed(2)}</td><td className="prov" /></tr>
                  <tr><th>MRR</th><td>${mrr.toFixed(2)}</td><td className="prov" /></tr>
                  <tr><th>Cost 30d</th><td>${spend.toFixed(2)}</td><td className="prov" /></tr>
                  <tr><th>Per job card</th><td>{carded ? `$${(spend / carded).toFixed(3)}` : '—'}</td><td className="prov" /></tr>
                  <tr><th>Per shop</th><td>{active.length ? `$${(spend / active.length).toFixed(2)}` : '—'}</td><td className="prov" /></tr>
                </tbody>
              </table>
            </div>

            <div className="panel">
              <h3>What the guard rails caught</h3>
              {violations.length ? (
                <ul className="equip">
                  {violations.map(([v, n]) => (
                    <li key={v}><span>{v}</span><b>{n}</b></li>
                  ))}
                </ul>
              ) : (
                <p className="panel-lead muted">Nothing blocked in 30 days.</p>
              )}
              <p className="panel-foot">
                {hazards} hazard {hazards === 1 ? 'escalation' : 'escalations'} &middot;{' '}
                {optouts.length} opt-{optouts.length === 1 ? 'out' : 'outs'} on record
              </p>
            </div>
          </div>

          <AdminPanels base={base} pricing={pricing} guardrails={guardrails} protectedKeys={PROTECTED} />

          <h2 className="dash-h2">Every shop</h2>
          <div className="joblist">
            {shops.length === 0 && <p className="panel-lead muted">No shops yet.</p>}
            {shops.map((s) => {
              const convs = conversations.filter((c) => c.shop_id === s.id).length;
              const jobs = cards.filter((c) => c.shop_id === s.id).length;
              const cost = costs.filter((c) => c.shop_id === s.id).reduce((a, r) => a + Number(r.usd || 0), 0);
              const sub = s.subscription_status || 'none';
              const cls = ['active', 'trialing'].includes(sub) ? 'on'
                        : sub === 'cancelling' || sub === 'past_due' ? 'warn' : 'off';
              return (
                <div key={s.id} className="jobrow" style={{ cursor: 'default' }}>
                  <div className="jobrow-main">
                    <b>{s.business_name}</b>
                    <span>
                      {prettyPhone(s.owner_phone)} &middot; {s.trade_id}
                      {s.assigned_number ? ` · line ${prettyPhone(s.assigned_number)}` : ' · no line'}
                    </span>
                  </div>
                  <div className="jobrow-kit">
                    <span className={`sub-pill ${cls}`}>{sub}</span>
                  </div>
                  <div className="jobrow-when">
                    {convs} calls · {jobs} cards · ${cost.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Foot />
    </>
  );
}
