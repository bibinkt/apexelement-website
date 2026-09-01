import { cookies } from 'next/headers';
import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import { shopForSession, COOKIE } from '../../../lib/fp/auth';
import { selectOne } from '../../../lib/fp/db';
import { loadShopData, summarise, dailySeries, DAY_NAMES } from '../../../lib/fp/analytics';
import { prettyPhone } from '../../../lib/fp/twilio';
import LoginForm from './login';
import { ProfileNudge, SubscriptionBar, ReferralOptIn } from './actions';
import { completion } from '../../../lib/fp/profile';
import { getTrade } from '../../../lib/fp/trades';
import { isSubscribed, configured } from '../../../lib/fp/billing';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard — FrontlinePros' , robots: { index: false, follow: false } };

function Spark({ series }) {
  const max = Math.max(1, ...series.map((d) => d.calls));
  const w = 100 / series.length;
  return (
    <div className="spark" aria-hidden="true">
      {series.map((d, i) => (
        <div key={d.date} className="spark-col" style={{ width: `${w}%` }}>
          <div className="spark-bar" style={{ height: `${(d.calls / max) * 100}%` }}>
            <div className="spark-fill" style={{ height: `${d.calls ? (d.jobs / d.calls) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function Dashboard({ searchParams }) {
  const base = productBase();
  const jar = cookies();

  // One-tap link from SMS: ?t=<session token>
  const linkToken = searchParams?.t;
  let shop = await shopForSession(linkToken || jar.get(COOKIE)?.value);

  if (!shop) {
    return (
      <>
        <Mast />
        <section className="dashsec">
          <div className="shell narrow">
            <div className="kicker">FrontlinePros</div>
            <h1 className="dash-h1">Your jobs</h1>
            <p className="lede">
              Sign in with the mobile number you signed up with. We&rsquo;ll text you a code.
            </p>
            <LoginForm base={base} />
          </div>
        </section>
        <Foot />
      </>
    );
  }

  const prof = completion(shop);
  const data = await loadShopData(shop.id, 30);
  const s = summarise(data, { timezone: shop.timezone });
  const series = dailySeries(data.conversations, data.cards, 30, shop.timezone);
  const busiestHour = s.byHour.indexOf(Math.max(...s.byHour));
  const busiestDay = s.byDay.indexOf(Math.max(...s.byDay));

  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell">
          <div className="dash-head">
            <div>
              <div className="kicker">{shop.business_name}</div>
              <h1 className="dash-h1">
                {s.carded} {s.carded === 1 ? 'job' : 'jobs'} you would have missed
              </h1>
              <p className="dash-sub">
                Last 30 days &middot;{' '}
                {shop.assigned_number ? `Your line ${prettyPhone(shop.assigned_number)}` : 'Number not assigned yet'}
                {shop.status !== 'active' && ' · setup incomplete'}
              </p>
            </div>
          </div>

          <SubscriptionBar
            base={base}
            status={shop.subscription_status}
            endsAt={shop.subscription_ends_at}
            billingOn={configured()}
          />
          <ProfileNudge
            base={base}
            shop={shop}
            fields={prof.missing}
            pct={prof.pct}
            done={prof.done}
            total={prof.total}
          />

          {/* headline tiles */}
          <div className="tiles">
            <div className="tile">
              <b>{s.total}</b>
              <span>Calls caught</span>
              <em>Rang out, we picked them up</em>
            </div>
            <div className="tile">
              <b>{s.engaged}</b>
              <span>Customers replied</span>
              <em>{s.engageRate}% of the calls we caught</em>
            </div>
            <div className="tile accent">
              <b>{s.carded}</b>
              <span>Job cards</span>
              <em>{s.captureRate}% turned into real work</em>
            </div>
            <div className="tile">
              <b>{s.medianMinutes != null ? `${s.medianMinutes}m` : '—'}</b>
              <span>Typical time to a card</span>
              <em>From missed call to your phone</em>
            </div>
          </div>

          {/* funnel */}
          <h2 className="dash-h2">Where the calls went</h2>
          <div className="funnel">
            {s.funnel.map((f, i) => {
              const pct = s.funnel[0].value ? Math.round((f.value / s.funnel[0].value) * 100) : 0;
              return (
                <div key={f.label} className="funnel-row">
                  <span className="funnel-label">{f.label}</span>
                  <div className="funnel-track">
                    <div className={`funnel-bar${i === 3 ? ' win' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="funnel-val">
                    {f.value}
                    <em>{pct}%</em>
                  </span>
                </div>
              );
            })}
          </div>

          {/* activity */}
          <h2 className="dash-h2">Last 30 days</h2>
          <Spark series={series} />
          <p className="spark-key">
            Each bar is a day. The filled part is the share that became a job card.
          </p>

          <div className="dash-grid">
            <div className="panel">
              <h3>When your phone rings out</h3>
              {s.total ? (
                <p className="panel-lead">
                  Busiest around <b>{busiestHour}:00</b>, and <b>{DAY_NAMES[busiestDay]}</b> is your
                  heaviest day.
                </p>
              ) : (
                <p className="panel-lead muted">No calls yet.</p>
              )}
              <div className="hours">
                {s.byHour.map((n, h) => {
                  const max = Math.max(1, ...s.byHour);
                  return (
                    <div key={h} className="hour" title={`${h}:00 — ${n}`}>
                      <div className="hour-bar" style={{ height: `${(n / max) * 100}%` }} />
                      {h % 6 === 0 && <span>{h}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel">
              <h3>What people are calling about</h3>
              {s.topEquipment.length ? (
                <ul className="equip">
                  {s.topEquipment.map(([type, n]) => (
                    <li key={type}>
                      <span>{type.replace(/_/g, ' ')}</span>
                      <b>{n}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-lead muted">Nothing identified yet.</p>
              )}
              <p className="panel-foot">
                {s.identifyRate}% of job cards had a model number read straight off the plate.
              </p>
            </div>
          </div>

          <ReferralOptIn base={base} shop={shop} tradeLabel={getTrade(shop.trade_id).trade_label} />

          {(s.hazards > 0 || s.stopped > 0) && (
            <div className="dash-note">
              {s.hazards > 0 && (
                <p>
                  <b>{s.hazards}</b> {s.hazards === 1 ? 'call was' : 'calls were'} flagged as urgent
                  and sent straight to you — no questions asked of the customer.
                </p>
              )}
              {s.stopped > 0 && (
                <p>
                  <b>{s.stopped}</b> {s.stopped === 1 ? 'person' : 'people'} replied STOP and will not
                  be texted again.
                </p>
              )}
            </div>
          )}

          {/* jobs */}
          <h2 className="dash-h2">Job cards</h2>
          {data.cards.length === 0 ? (
            <p className="panel-lead muted">
              Nothing yet. As soon as a call rings out, it&rsquo;ll show up here.
            </p>
          ) : (
            <div className="joblist">
              {data.cards.map((card) => {
                const conv = data.conversations.find((c) => c.id === card.conversation_id);
                const brand = card.fields?.brand?.value;
                const model = card.fields?.model_number?.value;
                return (
                  <a key={card.id} href={`${base}/dashboard/jobs/${card.id}`} className="jobrow">
                    <div className="jobrow-main">
                      <b>{conv ? prettyPhone(conv.caller_phone) : 'Customer'}</b>
                      <span>{(conv?.state?.complaint || '').slice(0, 90) || 'No description'}</span>
                    </div>
                    <div className="jobrow-kit">
                      {brand && brand !== 'unknown' ? (
                        <span className="chip ok">
                          {brand}
                          {model && model !== 'unknown' ? ` ${model}` : ''}
                        </span>
                      ) : (
                        <span className="chip">not identified</span>
                      )}
                    </div>
                    <div className="jobrow-when">
                      {card.closed_at && <span className="chip ok" style={{ marginRight: '8px' }}>closed</span>}
                      {new Date(card.created_at).toLocaleString('en-US', {
                        timeZone: shop.timezone || 'America/New_York',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Foot />
    </>
  );
}
