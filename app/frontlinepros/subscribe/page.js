import { cookies } from 'next/headers';
import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import { brand } from '../brand';
import { shopForSession, COOKIE } from '../../../lib/fp/auth';
import { isSubscribed, configured } from '../../../lib/fp/billing';
import SubscribeButton from './button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Subscribe' };

const FEATURES = [
  'Your own local number, and every missed call answered within seconds',
  'An AI assistant that knows your trade and asks what a technician would',
  'Reads make, model and serial off a photo — and says so when it can’t',
  'Screens out wrong numbers, out-of-area jobs and free-quote hunters',
  'Flags gas, smoke and flooding straight to you, no questions asked',
  'A written job card on your phone before you’ve wiped your hands',
  'Every conversation, transcript and photo kept in your dashboard',
  'Analytics: what you rescued, when your phone rings out, what people call about',
  'Keep your number and your carrier. Off again in one dial',
];

export default async function SubscribePage({ searchParams }) {
  const base = productBase();
  const shop = await shopForSession(cookies().get(COOKIE)?.value);
  const subscribed = isSubscribed(shop);

  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell narrow">
          <div className="kicker">Plan</div>
          <h1 className="dash-h1">
            {subscribed ? 'You’re on the plan' : `${brand.PRICE} a month, everything included`}
          </h1>
          <p className="lede" style={{ maxWidth: '48ch' }}>
            {subscribed
              ? 'Your line is live. You can cancel or change your card any time from your dashboard.'
              : 'One plan. No contract, no setup fee, and you can cancel from your dashboard whenever you like.'}
          </p>

          {searchParams?.cancelled && (
            <div className="formmsg err">Checkout cancelled — nothing was charged.</div>
          )}

          <div className="plan" style={{ marginTop: '26px' }}>
            <div className="plan-name">FrontlinePros</div>
            <div className="plan-price">
              <b>{brand.PRICE}</b>
              <span>per month</span>
            </div>
            <ul className="plan-list">
              {FEATURES.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <div className="plan-cta">
              <SubscribeButton
                base={base}
                signedIn={!!shop}
                subscribed={subscribed}
                billingOn={configured()}
              />
            </div>
            {!shop && (
              <p className="plan-fine">
                You’ll sign in with your mobile number first — no password to remember.
              </p>
            )}
          </div>
        </div>
      </section>
      <Foot />
    </>
  );
}
