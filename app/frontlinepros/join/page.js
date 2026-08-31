import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import JoinForm from './form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Finish setup — FrontlinePros' , robots: { index: false, follow: false } };

export default function JoinPage({ searchParams }) {
  const base = productBase();
  return (
    <>
      <Mast />
      <section className="dashsec">
        <div className="shell narrow">
          <div className="kicker">Setup</div>
          <h1 className="dash-h1">Nearly there</h1>
          <p className="lede">
            Six boxes and you&rsquo;re done. We use this to name your shop in the text your
            customer gets, and to ask the right questions for your trade.
          </p>
          <JoinForm base={base} phone={searchParams?.p || ''} />
        </div>
      </section>
      <Foot />
    </>
  );
}
