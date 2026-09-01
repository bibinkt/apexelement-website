import { cookies } from 'next/headers';
import { Mast, Foot } from '../../../chrome';
import { productBase } from '../../../nav';
import { shopForSession, COOKIE } from '../../../../../lib/fp/auth';
import { selectOne, select } from '../../../../../lib/fp/db';
import { prettyPhone } from '../../../../../lib/fp/twilio';
import { CloseJob } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Job card — FrontlinePros' };

const PROV_LABEL = {
  verified_from_photo: 'read off the plate',
  unreadable: 'not legible',
  customer_stated: 'customer said',
  not_provided: 'not provided',
};

export default async function JobCard({ params }) {
  const base = productBase();
  const shop = await shopForSession(cookies().get(COOKIE)?.value);

  if (!shop) {
    return (
      <>
        <Mast />
        <section className="dashsec">
          <div className="shell narrow">
            <h1 className="dash-h1">Please sign in</h1>
            <p className="lede">
              <a href={`${base}/dashboard`}>Go to the dashboard</a> to sign in with your mobile number.
            </p>
          </div>
        </section>
        <Foot />
      </>
    );
  }

  const card = await selectOne('fp_jobcards', `id=eq.${params.id}&shop_id=eq.${shop.id}`);
  if (!card) {
    return (
      <>
        <Mast />
        <section className="dashsec">
          <div className="shell narrow">
            <h1 className="dash-h1">Not found</h1>
            <p className="lede">
              That job card isn&rsquo;t on your account. <a href={`${base}/dashboard`}>Back to jobs</a>
            </p>
          </div>
        </section>
        <Foot />
      </>
    );
  }

  const conv = await selectOne('fp_conversations', `id=eq.${card.conversation_id}`);
  const messages = await select(
    'fp_messages',
    `conversation_id=eq.${card.conversation_id}&order=created_at.asc`
  );

  const f = card.fields || {};
  const rows = [
    ['Brand', f.brand],
    ['Type', f.equipment_type],
    ['Model', f.model_number],
    ['Serial', f.serial_number],
    ['Error code', f.error_code],
  ];

  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell narrow">
          <p className="backlink">
            <a href={`${base}/dashboard`}>&larr; All jobs</a>
          </p>
          <div className="kicker">{shop.business_name}</div>
          <h1 className="dash-h1">{conv ? prettyPhone(conv.caller_phone) : 'Job card'}</h1>
          <p className="dash-sub">
            {new Date(card.created_at).toLocaleString('en-US', {
              timeZone: shop.timezone || 'America/New_York',
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>

          {conv?.hazard && (
            <div className="hazard">
              <b>Flagged urgent.</b> The customer&rsquo;s words mentioned a hazard, so we stopped
              asking questions and told them to call you directly.
            </div>
          )}

          <h2 className="dash-h2">Equipment</h2>
          <table className="cardtable">
            <tbody>
              {rows.map(([label, field]) => {
                const value = field?.value || 'unknown';
                const prov = field?.provenance || 'not_provided';
                return (
                  <tr key={label}>
                    <th>{label}</th>
                    <td className={value === 'unknown' ? 'muted' : ''}>{value}</td>
                    <td className="prov">
                      <span className={`chip${prov === 'verified_from_photo' ? ' ok' : ''}`}>
                        {PROV_LABEL[prov] || prov}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="dash-h2">In the customer&rsquo;s own words</h2>
          <blockquote className="verbatim">
            &ldquo;{conv?.state?.complaint || 'Not given'}&rdquo;
          </blockquote>

          {conv?.state?.question && (
            <>
              <h2 className="dash-h2">Screening</h2>
              <p className="asked">{conv.state.question}</p>
              <blockquote className="verbatim">
                &ldquo;{conv.state.answer || 'No answer'}&rdquo;
              </blockquote>
            </>
          )}

          {conv?.state?.address && (
            <>
              <h2 className="dash-h2">Address</h2>
              <p>
                {conv.state.address} <span className="chip">customer said</span>
              </p>
            </>
          )}

          {conv?.state?.media_url && (
            <>
              <h2 className="dash-h2">Photo</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="platephoto" src={conv.state.media_url} alt="Equipment data plate" />
            </>
          )}

          <div className="notdiagnosed">
            <b>Not diagnosed.</b> No cause, part or repair has been determined. Anything marked
            &ldquo;not legible&rdquo; was not readable in the photo and is unconfirmed.
          </div>

          <h2 className="dash-h2">Close this out</h2>
          <CloseJob
            base={base}
            id={card.id}
            closed={!!card.closed_at}
            outcome={card.outcome}
            note={card.owner_note}
          />

          <h2 className="dash-h2">Full conversation</h2>
          <div className="thread">
            {messages
              .filter((m) => !m.blocked)
              .map((m) => (
                <div key={m.id} className={`bubble ${m.direction === 'in' ? 'them' : 'us'}`}>
                  {m.body}
                  {m.media_url && <span className="attach">photo attached</span>}
                  <time>
                    {new Date(m.created_at).toLocaleTimeString('en-US', {
                      timeZone: shop.timezone || 'America/New_York',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              ))}
          </div>
        </div>
      </section>
      <Foot />
    </>
  );
}
