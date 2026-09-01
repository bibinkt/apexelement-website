import { brand } from './brand';
import { Mast, Foot } from './chrome';
import { productBase } from './nav';
import { PhoneMockup } from './phone';
import { JobCardPhone } from './jobcard';
import AskMore from './askmore';

const IMG = (id, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

// Marked up so the questions can win their own result rather than sitting
// invisible inside the page body.
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do I have to change my phone number?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Calls ring your existing number on your existing carrier. We only pick up the ones you don't."
      }
    },
    {
      "@type": "Question",
      "name": "What if I answer the phone?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nothing happens. It only triggers on an unanswered call."
      }
    },
    {
      "@type": "Question",
      "name": "Does the customer know it's automated?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "They know they're texting your shop. It's brief and it's polite, and it never pretends to diagnose anything \u2014 it asks questions and hands you the answers."
      }
    },
    {
      "@type": "Question",
      "name": "What if the photo is unreadable?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It tells you it couldn't read it rather than guessing."
      }
    },
    {
      "@type": "Question",
      "name": "What does it cost to set up?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nothing. Ten minutes on the phone and one code dialled into your handset."
      }
    },
    {
      "@type": "Question",
      "name": "What if a customer replies STOP?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "They stop hearing from the system immediately and we keep a record so it stays that way. You can still call them back yourself."
      }
    }
  ]
};

export default function FrontlinePros() {
  const b = productBase();
  return (
    <>
      <Mast />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />

      {/* ── HERO ───────────────────────────────────────── */}
      <div className="hero">
        <img className="hero-bg" src={IMG(6419128, 1600)} alt="" aria-hidden="true" />
        <div className="hero-veil" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="kicker">An AI front desk for the trades</div>
            <h1>You were under a sink. It answered anyway.</h1>
            <p className="lede">
              Every call you can&rsquo;t reach is a customer already dialling someone else.
              {' '}{brand.NAME} picks it up for you within seconds &mdash; an AI assistant that
              knows your trade, asks what a good technician would ask, reads the model number
              off a photo, and quietly refuses to guess at anything it can&rsquo;t see. You come
              off the job to a written work order, not a missed call.
            </p>
            <p className="hero-cta">
              <a href={`tel:${brand.PHONE_E164}`} className="btn">
                Call {brand.PHONE} &mdash; see it work
              </a>
              <a href="#how" className="btn btn-ghost">
                How it works
              </a>
            </p>
            <p className="hero-note">
              Ring it and let it ring out. You&rsquo;ll get the same text your customer would.
            </p>
            <div className="trust">
              <span>Keep your number</span>
              <span>Keep your carrier</span>
              <span>Off in one dial</span>
            </div>
          </div>

          <PhoneMockup />
        </div>
      </div>

      {/* ── TRUST ──────────────────────────────────────── */}
      <div className="trustbar">
        <div className="shell trustbar-in">
          <div>
            <b>It knows your trade</b>
            <span>Different questions for HVAC and appliances.</span>
          </div>
          <div>
            <b>We answer our own phone</b>
            <span>It would be a strange product if we didn&rsquo;t.</span>
          </div>
          <div>
            <b>Not a call centre</b>
            <span>Nobody else speaks to your customers.</span>
          </div>
          <div>
            <b>Off in one dial</b>
            <span>You are never locked in.</span>
          </div>
        </div>
      </div>

      {/* ── PROBLEM ────────────────────────────────────── */}
      <section className="split">
        <div className="shell split-grid">
          <figure className="shot">
            <img src={IMG(4489794, 900)} alt="Technician standing in a workshop" loading="lazy" />
          </figure>
          <div>
            <h2>The problem</h2>
            <h3>Every unanswered call is a customer dialling the next shop on the list.</h3>
            <p>
              You can&rsquo;t stop to answer the phone with your hands inside a machine, and by the
              time you call back that evening, the job is gone.
            </p>
            <p>
              Voicemail doesn&rsquo;t fix it. Most people won&rsquo;t leave one, and the ones who do
              just say &ldquo;call me back.&rdquo;
            </p>
            <div className="statline">
              <div>
                <b>20 sec</b>
                <span>before it steps in</span>
              </div>
              <div>
                <b>0</b>
                <span>changes to your phone</span>
              </div>
              <div>
                <b>1 dial</b>
                <span>to switch it off</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW ────────────────────────────────────────── */}
      <section id="how">
        <div className="shell">
          <h2>How it works</h2>
          <ol className="steps">
            <li>
              <b>Your phone rings as normal.</b>
              Nothing changes. You answer whatever you can.
            </li>
            <li>
              <b>If nobody picks up after 20 seconds, we text the caller.</b>
              From a number that names your shop, not some 1-800 line.
            </li>
            <li>
              <b>It asks the questions you would have asked.</b>
              What&rsquo;s doing what, since when, whether it&rsquo;s still running, where they are
              and when they&rsquo;re free &mdash; and a photo when a photo saves you a trip.
            </li>
            <li>
              <b>You get a job card.</b>
              Customer, address, equipment, what they said, what it screened out, and anything they
              sent. Ready when you finish the job you&rsquo;re on.
            </li>
          </ol>
        </div>
      </section>

      {/* ── WHAT IT ASKS ───────────────────────────────── */}
      <section id="asks" className="asksec">
        <div className="shell">
          <h2>It&rsquo;s a conversation, not an upload form</h2>
          <p className="asklede">
            The photo is one question out of many, and on plenty of jobs it never asks for one. What
            it&rsquo;s really doing is the front-desk work you don&rsquo;t have time for.
          </p>
          <div className="ask-grid" id="ask-grid">
            <div>
              <b>Qualifies the job</b>
              <span>
                Is this a repair you take, in an area you cover? It sorts the real jobs from the
                wrong numbers and the landlord who wants a free quote.
              </span>
            </div>
            <div>
              <b>Screens the obvious first</b>
              <span>
                Breaker on, valve open, filter clogged, door sealing. Sometimes it fixes the problem
                over text and saves you the drive entirely.
              </span>
            </div>
            <div>
              <b>Catches the dangerous ones</b>
              <span>
                Gas, burning smells, water coming through a ceiling. It stops asking questions and
                tells them to call you or 911 right away.
              </span>
            </div>
            <div>
              <b>Gets you what you need to quote</b>
              <span>
                Make, model, age, symptom &mdash; from a photo if there&rsquo;s a plate to read,
                from plain questions if there isn&rsquo;t.
              </span>
            </div>
            <div>
              <b>Books the window</b>
              <span>
                Address, when they&rsquo;re actually home, and whether someone can let you in. No
                phone tag at seven in the evening.
              </span>
            </div>
            <div>
              <b>Keeps them warm</b>
              <span>
                They get an answer in twenty seconds instead of silence, so they stop working down
                the list of your competitors.
              </span>
            </div>
          </div>
          <AskMore targetId="ask-grid" />
        </div>
      </section>

      {/* ── JOB CARD ───────────────────────────────────── */}
      <section className="cardsec">
        <div className="shell split-grid reverse">
          <div>
            <h2>What lands on your phone</h2>
            <h3>A work order, not a voicemail.</h3>
            <p>
              Everything you need to price the job and load the van, written down before you wipe
              your hands.
            </p>
            <p className="caveat">
              <strong>It never guesses.</strong> If the model plate isn&rsquo;t readable, it says so
              rather than sending you the wrong part number. A wrong model number is worse than no
              model number.
            </p>
          </div>
          <JobCardPhone />
        </div>
      </section>

      {/* ── OBJECTIONS ─────────────────────────────────── */}
      <section className="keepsec">
        <div className="shell">
          <h2>What doesn&rsquo;t change</h2>
          <ul className="keeps">
            <li>
              <b>You keep your number.</b>
              <span>Nothing to port, nothing to re-print, nothing new to answer.</span>
            </li>
            <li>
              <b>You keep your phone company.</b>
              <span>We don&rsquo;t touch your voice service.</span>
            </li>
            <li>
              <b>You answer first, always.</b>
              <span>It only steps in after 20 seconds of ringing.</span>
            </li>
            <li>
              <b>You can switch it off in one dial.</b>
              <span>We show you the code on day one.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── TRADES ─────────────────────────────────────── */}
      <section className="trades">
        <div className="shell">
          <h2>Built for three trades</h2>
          <div className="trade-grid">
            <figure>
              <img src={IMG(8005397, 700)} alt="Appliance technician at work" loading="lazy" />
              <figcaption>
                <b>Appliance repair</b>
                <span>Model and serial off the data plate before you order the part.</span>
              </figcaption>
            </figure>
            <figure>
              <img src={IMG(6419128, 700)} alt="HVAC technician working on ductwork" loading="lazy" />
              <figcaption>
                <b>HVAC</b>
                <span>Unit tonnage, age and symptom captured while you&rsquo;re on the roof.</span>
              </figcaption>
            </figure>
            <figure>
              <img src={IMG(4489794, 700)} alt="Plumber in a workshop" loading="lazy" />
              <figcaption>
                <b>Plumbing</b>
                <span>Fixture, location and whether the water is off &mdash; before you roll.</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ── OFFER ──────────────────────────────────────── */}
      {/* ── PRICING ────────────────────────────────── */}
      <section className="band" id="pricing">
        <div className="shell">
          <h2>Pricing</h2>
          <div className="planwrap">
            <div className="plan">
              <div className="plan-head">
                <div className="plan-name">FrontlinePros</div>
                <div className="plan-price">
                  <b>$10</b>
                  <span>per month</span>
                </div>
                <p className="plan-sub">
                  Everything below. No contract, no setup fee, cancel from your dashboard
                  whenever you like.
                </p>
              </div>
              <ul className="plan-list">
                <li>Your own local number, and every missed call answered within seconds</li>
                <li>An AI assistant that knows your trade and asks what a technician would</li>
                <li>Reads make, model and serial off a photo &mdash; and says so when it can&rsquo;t</li>
                <li>Screens out the wrong numbers, the out-of-area jobs and the free-quote hunters</li>
                <li>Flags gas, smoke and flooding straight to you, no questions asked</li>
                <li>A written job card on your phone before you&rsquo;ve wiped your hands</li>
                <li>Every conversation, transcript and photo kept in your dashboard</li>
                <li>Analytics: what you rescued, when your phone rings out, what people call about</li>
                <li>Keep your number and your carrier. Off again in one dial</li>
              </ul>
              <p className="plan-cta">
                <a href={`${b}/subscribe`} className="btn">Start for {brand.PRICE} a month</a>
              </p>
              <p className="plan-fine">
                You&rsquo;ll sign in with your mobile number &mdash; no password to remember.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section>
        <div className="shell">
          <h2>Questions</h2>
          <dl className="faq">
            <div>
              <dt>Do I have to change my phone number?</dt>
              <dd>
              No. Calls ring your existing number on your existing carrier. We only pick up the ones
              you don&rsquo;t.
            </dd>
            </div>
            <div>
              <dt>What if I answer the phone?</dt>
              <dd>Nothing happens. It only triggers on an unanswered call.</dd>
            </div>
            <div>
              <dt>Does the customer know it&rsquo;s automated?</dt>
              <dd>
              They know they&rsquo;re texting your shop. It&rsquo;s brief and it&rsquo;s polite, and
              it never pretends to diagnose anything &mdash; it asks questions and hands you the
              answers.
            </dd>
            </div>
            <div>
              <dt>What if the photo is unreadable?</dt>
              <dd>It tells you it couldn&rsquo;t read it rather than guessing.</dd>
            </div>
            <div>
              <dt>What does it cost to set up?</dt>
              <dd>Nothing. Ten minutes on the phone and one code dialled into your handset.</dd>
            </div>
            <div>
              <dt>What if a customer replies STOP?</dt>
              <dd>
              They stop hearing from the system immediately and we keep a record so it stays that
              way. You can still call them back yourself.
            </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── CLOSER ─────────────────────────────────────── */}
      <section className="closer">
        <img className="closer-bg" src={IMG(8005397, 1400)} alt="" aria-hidden="true" />
        <div className="closer-veil" />
        <div className="shell">
          <h3>Stop losing the call you couldn&rsquo;t get to.</h3>
          <p>Ten minutes to set up. Nothing to install. Cancel any time.</p>
          <p>
            <a href={`tel:${brand.PHONE_E164}`} className="btn">
              Call {brand.PHONE}
            </a>
          </p>
          <p className="closer-alt">
            Or <a href={`${b}/contact`}>leave us a note</a> and we&rsquo;ll ring you back.
          </p>
        </div>
      </section>

      <Foot />
    </>
  );
}
