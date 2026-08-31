import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import ContactForm from './form';
import { brand } from '../brand';

export const metadata = {
  title: `Try it — ${brand.NAME}`,
  description:
    'Call us. If we don\'t pick up in 20 seconds, you\'ll get exactly what your customers get.',
};

export default function ContactPage() {
  const b = productBase();
  return (
    <>
      <Mast />

      <section className="trysec">
        <div className="shell">
          <div className="kicker">See it work</div>
          <h1 className="tryhead">
            Call us. If we don&rsquo;t pick up in 20 seconds, you&rsquo;ll get exactly what your
            customers get.
          </h1>
          <p className="lede">
            Don&rsquo;t take our word for it and don&rsquo;t fill in a form. Ring the number below
            from your mobile. Let it ring out. Watch what lands.
          </p>

          <a href={`tel:${brand.PHONE_E164}`} className="bignum">
            <span className="bignum-label">Call now</span>
            <span className="bignum-digits">{brand.PHONE}</span>
          </a>

          <ol className="trysteps">
            <li>
              <b>Ring it and let it ring.</b>
              Nobody picks up. That&rsquo;s the point.
            </li>
            <li>
              <b>Twenty seconds later you get a text.</b>
              The same one your customer would get.
            </li>
            <li>
              <b>Reply to it.</b>
              Send a photo of any data plate you&rsquo;ve got. See what comes back.
            </li>
          </ol>

          <p className="tryfoot">
            If you&rsquo;d rather just talk, ring the same number in working hours and someone will
            pick up. We answer our own phone &mdash; it would be a strange product if we
            didn&rsquo;t.
          </p>
        </div>
      </section>

      <section className="altsec">
        <div className="shell narrow">
          <h2>Or leave us a note</h2>
          <p>
            Prefer email? Tell us what you run and roughly how many calls a week go unanswered.
            We&rsquo;ll call you back &mdash; a real person, ten minutes, no presentation.
          </p>
          <ContactForm base={b} />
        </div>
      </section>

      <Foot />
    </>
  );
}
