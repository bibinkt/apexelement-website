import { cookies } from 'next/headers';
import { Mast, Foot } from '../../chrome';
import { productBase } from '../../nav';
import { adminForSession, ADMIN_COOKIE } from '../../../../lib/fp/admin';
import TechConsole from './console';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tech', robots: { index: false, follow: false } };

export default async function TechPage({ searchParams }) {
  const base = productBase();
  const admin = await adminForSession(cookies().get(ADMIN_COOKIE)?.value);

  if (!admin) {
    return (
      <>
        <Mast />
        <section className="dashsec">
          <div className="shell narrow">
            <h1 className="dash-h1">Admin only</h1>
            <p className="lede"><a href={`${base}/admin`}>Sign in</a> to see this.</p>
          </div>
        </section>
        <Foot />
      </>
    );
  }

  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell">
          <p className="backlink"><a href={`${base}/admin`}>&larr; Admin</a></p>
          <div className="kicker">Under the bonnet</div>
          <h1 className="dash-h1" style={{ marginBottom: '6px' }}>How it actually works</h1>
          <p className="dash-sub">
            The live architecture, the tables behind it, and everything we hold on one caller.
          </p>
          <TechConsole base={base} startShopId={searchParams?.shop || null} />
        </div>
      </section>
      <Foot />
    </>
  );
}
