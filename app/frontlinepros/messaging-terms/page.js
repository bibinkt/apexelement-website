import { brand } from '../brand';
import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';

export const metadata = { title: 'Messaging Terms — ' + brand.NAME };

export default function Page() {
  const b = productBase();
  return (
    <>
      <Mast />
      <div className="shell narrow doc">
        <div className="doc-head">
          <div className="kicker">{brand.NAME}</div>
          <h1>Messaging Terms &amp; Conditions</h1>
        </div>
<p className="dates"><strong>Effective date:</strong> {brand.EFFECTIVE_DATE}</p>

<div className="note">
  <p><strong>FrontlinePros runs two separate text message programs.</strong> <strong>Program A</strong> is for business owners who asked to hear from us and ticked the consent box on our contact form. <strong>Program B</strong> is for consumers who telephoned a repair business and did not get an answer. They have different consent, different numbers and separate registrations. Either can be stopped by replying STOP.</p>
</div>

<h2>Program A &mdash; FrontlinePros Business Updates</h2>
<p><strong>Program name:</strong> FrontlinePros Business Updates</p>
<p><strong>Operated by:</strong> ApexElement LLC, a Florida limited liability company.</p>
<p><strong>Who receives messages:</strong> Owners, managers and decision-makers at independent appliance repair, HVAC, plumbing and similar home-service businesses in the United States who have opted in as described below.</p>
<p><strong>What we send:</strong> A confirmation when you opt in, information about what our missed-call text-back service does and what it costs, invitations to a short demonstration call, occasional pricing and availability announcements, and follow-ups on a demonstration you asked for.</p>
<p><strong>Message type:</strong> <strong>Marketing and account messages</strong> about the FrontlinePros service, sent to business contacts who opted in.</p>

<h2>How you opt in</h2>
<p>There is <strong>one</strong> way to join this program.</p>
<ol>
  <li>You visit our <a href={`${b}/contact`}>contact page</a>.</li>
  <li>You complete the form, including your mobile number.</li>
  <li>Below the form there is a <strong>separate checkbox that is not ticked when the page loads</strong>. You must tick it yourself. It reads:
    <div className="sample">Text me about FrontlinePros. I agree to receive marketing and account text messages from FrontlinePros (ApexElement LLC) at the mobile number above, including messages sent using automated technology. Msg frequency varies, about 2&ndash;4 per month. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of any purchase. See our Privacy Policy and Messaging Terms.</div>
  </li>
  <li>You submit the form. We record your number, the date and time, and the exact wording above.</li>
  <li>We send one confirmation text. You are then in the program.</li>
</ol>
<p><strong>Ticking the box is optional.</strong> You can submit the form without ticking it, and we will contact you by email only.</p>
<ul>
  <li>We do not purchase, rent, import, upload or append lists of telephone numbers.</li>
  <li>We do not text any number that has not opted in through the checkbox above.</li>
  <li>Consent to receive these messages is <strong>not</strong> a condition of any purchase.</li>
  <li>You may withdraw consent at any time by replying STOP.</li>
</ul>

<h2>Message frequency</h2>
<p>Message frequency varies, and is typically <strong>two to four messages per month</strong>.</p>

<h2>Cost</h2>
<p><strong>Message and data rates may apply.</strong> FrontlinePros does not charge you for these messages, but your mobile carrier's standard rates for text messages and data apply. Check your plan if you are unsure.</p>

<h2>How to stop</h2>
<div className="sample">Reply STOP to any message.</div>
<p>You will receive one confirmation message and then no further messages from this program. <strong>UNSUBSCRIBE</strong>, <strong>CANCEL</strong>, <strong>END</strong> and <strong>QUIT</strong> work the same way. Opt-out requests are honoured immediately and recorded so they continue to be honoured. Reply <strong>START</strong> if you ever want to rejoin.</p>
<p>Stopping texts does not stop us replying to an email you send us.</p>

<h2>How to get help</h2>
<div className="sample">Reply HELP to any message.</div>
<p>You will receive a reply identifying FrontlinePros and how to reach us. You may also contact us:</p>
<p><a href="mailto:hello@apexelement.ai">{brand.EMAIL}</a> &middot; or the <a href={`${b}/contact`}>contact form</a> on this site.</p>

<h2>Carriers</h2>
<p><strong>Carriers are not liable for delayed or undelivered messages.</strong> Delivery depends on your mobile carrier's network and is not guaranteed. This program is supported on major US carriers; carrier participation may change without notice.</p>

<h2>Eligibility</h2>
<p>This program is intended for people aged 18 or over, located in the United States, acting on behalf of a home-service business.</p>

<h2>Privacy</h2>
<p>We collect your telephone number, the date and time you opted in, the consent wording shown to you, and the content of your messages, in order to send you the messages you asked for and to answer your replies.</p>
<div className="note">
  <p><strong>No mobile information — including your telephone number, your opt-in status, or the content of your messages — is sold, rented, or shared with any third party or affiliate for that third party's marketing or promotional purposes.</strong> For Program A this information stays with ApexElement LLC and the service providers strictly necessary to deliver the messages. For Program B it is shared only with the business you telephoned and those same providers.</p>
</div>
<p>Full detail is in our <a href={`${b}/privacy`}>Privacy Policy</a>.</p>
<p><strong>Please do not send payment card details, bank details, identification numbers or health information by text.</strong> We never ask for them.</p>

<h2>Not for emergencies</h2>
<p>This program must not be used to report an emergency. <strong>If you smell gas, suspect a carbon-monoxide leak, or face fire, flooding or any risk to life or property, call 911 or your utility's emergency line.</strong> Automated text messages are not monitored continuously and must not be relied on in an emergency.</p>

<hr />

<h2>Program B &mdash; FrontlinePros Missed-Call Reply</h2>
<div className="note">
  <p><strong>This is a separate program with its own consent, its own numbers and its own registration.</strong> It is for consumers, not for business owners. Nothing on the rest of this page opts anyone into it, and joining Program A does not join you to this one.</p>
</div>
<p><strong>Operated by:</strong> ApexElement LLC on behalf of independent appliance repair, HVAC, plumbing and similar home-service businesses.</p>
<p><strong>Who receives messages:</strong> A consumer who has just telephoned a participating business and whose call was not answered.</p>
<p><strong>Message type:</strong> Conversational customer care &mdash; a reply to the enquiry you started by calling. <strong>No marketing or promotional content is sent through this program.</strong></p>

<h3>How consent works</h3>
<p>Consent is <strong>your own inbound telephone call to the business</strong>. There is no form to fill in and no list.</p>
<ol>
  <li>You dial the published number of a participating business because you want a repair.</li>
  <li>Nobody answers within about 20 seconds, because the technicians are out on a job.</li>
  <li>That business&rsquo;s own telephone carrier forwards the unanswered call to the FrontlinePros line assigned to that business. Calls the business answers are never forwarded.</li>
  <li>You hear a short recorded greeting that names the business, apologises for missing you, and tells you a text is on its way.</li>
  <li>You receive a text. It names the business, says message and data rates may apply, and tells you to reply STOP to opt out or HELP for help.</li>
  <li>You reply if you want to. You can reply STOP at any point.</li>
</ol>
<p>We record your number, the time of your call and which business you called. We never text a number that has not just called a participating business, and we never buy, rent, import or upload numbers. Consent is not a condition of any purchase.</p>

<h3>What it asks you</h3>
<p>What has gone wrong, how long it has been happening, where you are and when you are free. It may ask for a photograph &mdash; often of the manufacturer&rsquo;s data plate &mdash; so the technician arrives with the right part. Your answers go to the business as a job card so they can call you back and book the work.</p>

<h3>Frequency, stopping and help</h3>
<p>Frequency varies with the conversation; a typical enquiry is <strong>fewer than 10 messages</strong>, and nothing recurring is sent once it is finished. <strong>Message and data rates may apply.</strong> Reply <strong>STOP</strong> to unsubscribe immediately and permanently, or <strong>HELP</strong> to get the business&rsquo;s identity and a support address. Stopping the texts does not stop the business returning your call by telephone.</p>

<div className="note">
  <p><strong>Not for emergencies.</strong> If you smell gas, suspect a carbon-monoxide leak, or face fire, flooding or any risk to life or property, call 911 or your utility&rsquo;s emergency line. These messages are not monitored continuously.</p>
</div>

<hr />

<h2>Quick reference &mdash; Program A</h2>
<table>
  <tr><th>Program</th><td>FrontlinePros Business Updates</td></tr>
  <tr><th>Operator</th><td>ApexElement LLC</td></tr>
  <tr><th>Message type</th><td>Marketing and account messages to opted-in business contacts</td></tr>
  <tr><th>Consent</th><td>Checkbox, unticked by default, on our <a href={`${b}/contact`}>contact page</a></td></tr>
  <tr><th>Frequency</th><td>Varies; about 2&ndash;4 messages per month</td></tr>
  <tr><th>Cost</th><td>Message and data rates may apply</td></tr>
  <tr><th>Opt out</th><td>Reply STOP</td></tr>
  <tr><th>Help</th><td>Reply HELP, or {brand.EMAIL}</td></tr>
  <tr><th>Privacy</th><td><a href={`${b}/privacy`}>Privacy Policy</a></td></tr>
</table>
      </div>
      <Foot />
    </>
  );
}
