import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import { shopForSession, COOKIE } from '../../../lib/fp/auth';
import LoginFlow from './flow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }) {
  const base = productBase();
  const shop = await shopForSession(cookies().get(COOKIE)?.value);
  const next = searchParams?.next || '/dashboard';
  if (shop) redirect(`${base}${next}`);

  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell narrow">
          <div className="kicker">FrontlinePros</div>
          <h1 className="dash-h1">Sign in</h1>
          <p className="lede" style={{ maxWidth: '46ch' }}>
            No password. We&rsquo;ll text a six-digit code to your mobile — the same number your
            job cards go to.
          </p>
          <LoginFlow base={base} next={next} />
        </div>
      </section>
      <Foot />
    </>
  );
}
