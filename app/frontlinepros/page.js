import Link from 'next/link';
import { brand, base } from './brand';
import { Mast, Foot } from './chrome';

export default function FrontlinePros() {
  return (
    <>
      <Mast />

      <div className="hero">
        <div className="shell hero-grid">
          <div>
            <div className="kicker">Missed-call textback for the trades</div>
            <h1>The call you missed just texted you back.</h1>
            <p className="lede">
              When your phone rings and everyone&rsquo;s on a job, {brand.NAME} answers by text
              within seconds &mdash; from your own number. It finds out what&rsquo;s broken, gets a
              photo of the model plate, and sends you a job card before the customer has called
              anyone else.
            </p>
            <p>
              <Link href={`${base}/contact`} className="btn">
                Claim a founding spot
              </Link>
              <Link href="#how" className="btn btn-ghost btn-next">
                How it works
              </Link>
            </p>
            <div className="trust">
              Keep your number &middot; Keep your carrier &middot; Switch it off in one dial
            </div>
          </div>

          {/* the conversation the customer actually sees */}
          <div className="phone">
            <div className="phone-top">
              <span className="dot" />
              <div>
                <b>Your Shop</b>
                <em>(407) 555-0110</em>
              </div>
            </div>
            <div className="thread">
              <div className="stamp">Missed call &mdash; 2:14 PM</div>
              <div className="msg out">
                Hi, this is Ace Appliance. Sorry we couldn&rsquo;t pick up &mdash; we&rsquo;re on a
                job. What&rsquo;s giving you trouble?
              </div>
              <div className="msg in">
                Fridge stopped cooling. Freezer&rsquo;s still fine though
              </div>
              <div className="msg out">
                Got it. Can you send a photo of the sticker inside the door with the model number?
              </div>
              <div className="msg in photo">
                <span>📷</span> data-plate.jpg
              </div>
              <div className="msg out">
                Perfect &mdash; Whirlpool WRF535SWHZ04. Is the door sealing shut, and is the breaker
                on?
              </div>
              <div className="msg in">Both fine</div>
              <div className="msg out">
                Thanks. Tom will call you back within the hour with a time.
              </div>
              <div className="stamp">Job card sent to your phone &mdash; 2:16 PM</div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="shell">
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
        </div>
      </section>

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
              From your business number, not some 1-800 line.
            </li>
            <li>
              <b>It gets the details.</b>
              What&rsquo;s wrong, and a photo of the manufacturer&rsquo;s data plate so you have the
              exact model and serial before you leave the shop.
            </li>
            <li>
              <b>You get a job card.</b>
              Customer, address, equipment, model number, what they said, and the photo. Ready when
              you finish the job you&rsquo;re on.
            </li>
          </ol>
        </div>
      </section>

      <section>
        <div className="shell">
          <h2>What lands on your phone</h2>
          <div className="card">
            <div className="card-head">
              <span>Job Card</span>
              <span>No. 1042</span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="k">Customer</div>
                <div className="v">Dana Whitfield &middot; (407) 555-0148</div>
              </div>
              <div className="row">
                <div className="k">Service address</div>
                <div className="v">218 Palmetto Ln, Winter Park, FL 32789</div>
              </div>
              <div className="row">
                <div className="k">Equipment</div>
                <div className="v">
                  Whirlpool &middot; WRF535SWHZ04 &middot; Serial HRB4102877
                  <br />
                  <span className="sub">read from data plate photo</span>
                </div>
              </div>
              <div className="row">
                <div className="k">Problem</div>
                <div className="v">
                  &ldquo;Fridge side stopped getting cold since yesterday, freezer still fine,
                  making a clicking noise every few minutes.&rdquo;
                </div>
              </div>
              <div className="row">
                <div className="k">Screening</div>
                <div className="v">Door confirmed sealing &middot; breaker not tripped</div>
              </div>
              <div className="row">
                <div className="k">Photo</div>
                <div className="v full">
                  <div className="photo-slot">Data plate photo attached</div>
                </div>
              </div>
            </div>
          </div>
          <p className="caveat">
            <strong>It never guesses.</strong> If the model plate isn&rsquo;t readable, it says so
            rather than sending you the wrong part number. A wrong model number is worse than no
            model number.
          </p>
        </div>
      </section>

      <section>
        <div className="shell">
          <h2>What doesn&rsquo;t change</h2>
          <ul className="keeps">
            <li>
              <b>You keep your number.</b>
              <span>No porting, no new line, nothing to print again.</span>
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

      <section className="band" id="offer">
        <div className="shell">
          <h2>Founding member offer</h2>
          <div className="offer-grid">
            <div>
              <h3>Five shops in Florida. Free for life.</h3>
              <p>
                In exchange you tell us what&rsquo;s wrong with it while we build it, and once
                it&rsquo;s saved you five calls, you give us a short video saying so.
              </p>
              <p className="price">After that it&rsquo;s {brand.PRICE} a month. Setup is free.</p>
              <p style={{ marginTop: '22px' }}>
                <Link href={`${base}/contact`} className="btn">
                  Talk to us
                </Link>
              </p>
            </div>
            <div className="tally">
              <div className="tally-head">Spots remaining</div>
              <div className="tally-marks">
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
              </div>
              <div className="tally-foot">5 of 5</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="shell">
          <h2>Questions</h2>
          <dl className="faq">
            <dt>Do I have to change my phone number?</dt>
            <dd>
              No. Calls ring your existing number on your existing carrier. We only pick up the ones
              you don&rsquo;t.
            </dd>

            <dt>What if I answer the phone?</dt>
            <dd>Nothing happens. It only triggers on an unanswered call.</dd>

            <dt>Does the customer know it&rsquo;s automated?</dt>
            <dd>
              They know they&rsquo;re texting your shop. It&rsquo;s brief and it&rsquo;s polite, and
              it never pretends to diagnose anything &mdash; it asks questions and hands you the
              answers.
            </dd>

            <dt>What if the photo is unreadable?</dt>
            <dd>It tells you it couldn&rsquo;t read it rather than guessing.</dd>

            <dt>What does it cost to set up?</dt>
            <dd>Nothing. Ten minutes on the phone and one code dialled into your handset.</dd>

            <dt>What if a customer replies STOP?</dt>
            <dd>
              They stop hearing from the system immediately, and we keep a record so it stays that
              way. You can still call them back yourself.
            </dd>
          </dl>
        </div>
      </section>

      <section className="closer">
        <div className="shell">
          <h3>Stop losing the call you couldn&rsquo;t get to.</h3>
          <p>
            <Link href={`${base}/contact`} className="btn">
              Claim a founding spot
            </Link>
          </p>
        </div>
      </section>

      <Foot />
    </>
  );
}
