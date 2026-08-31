import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import Sim from './sim';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Test bench — FrontlinePros',
  robots: { index: false, follow: false },
};

export default function TestPage() {
  const base = productBase();
  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell">
          <div className="kicker">Temporary test bench</div>
          <h1 className="dash-h1">Try the whole thing without a phone</h1>
          <p className="lede" style={{ maxWidth: '64ch' }}>
            This drives the <strong>real production code</strong> — the same onboarding, the same
            L0&ndash;L6 chain, the same confidence router and job card assembler. Only two edges are
            swapped: the database is a scratch copy that lives in your browser tab, and text
            messages are captured on screen instead of being handed to a carrier. If it behaves here,
            it behaves on a real phone.
          </p>
          <Sim base={base} />
        </div>
      </section>
      <Foot />
    </>
  );
}
