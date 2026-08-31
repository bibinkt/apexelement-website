import { brand } from '../brand';
import { Mast, Foot } from '../chrome';

export const metadata = { title: 'Messaging Terms — ' + brand.NAME };

export default function Page() {
  return (
    <>
      <Mast />
      <div className="shell narrow doc">
<p className="dates"><strong>Effective date:</strong> <span className="fill">[DATE]</span></p>

<div className="note">
  <p><strong>You receive a text from Ring Wrench only because you telephoned a repair business and nobody was able to answer.</strong> The message comes from that business's own number and is a direct reply to your call. It is not marketing.</p>
</div>

<h2>Program description</h2>
<p><strong>Program name:</strong> Ring Wrench Missed-Call Reply</p>
<p><strong>Operated by:</strong> ApexElement LLC on behalf of independent appliance repair, HVAC and plumbing businesses.</p>
<p><strong>What it does:</strong> When you call a participating business and the call is not answered within approximately 20 seconds, the business's number sends you a text message. The exchange asks what equipment needs attention, what the problem is, and may ask you to send a photograph of the manufacturer's data plate so the technician knows the exact model before arriving. Your answers are passed to the business as a job card.</p>
<p><strong>Message type:</strong> Conversational and transactional — customer service replies to an enquiry you initiated. <strong>No marketing or promotional messages are sent through this program.</strong></p>

<h2>Consent</h2>
<p>Consent to receive these messages is established by <strong>your inbound telephone call to the business</strong>. By calling a participating business you are making an enquiry, and the text reply is the business responding to it.</p>
<ul>
  <li>We do not text numbers that have not called a participating business.</li>
  <li>We do not purchase, rent, import or upload lists of telephone numbers.</li>
  <li>Consent to receive these messages is <strong>not</strong> a condition of any purchase.</li>
  <li>You may withdraw consent at any time by replying STOP.</li>
</ul>

<h2>Message frequency</h2>
<p>Message frequency varies and depends on the conversation needed to describe the fault. A typical enquiry involves <strong>fewer than 10 messages</strong>. Messages are sent only in response to a missed call and to your subsequent replies. Recurring messages are not sent after the enquiry is complete.</p>

<h2>Cost</h2>
<p><strong>Message and data rates may apply.</strong> Ring Wrench does not charge you for these messages, but your mobile carrier's standard rates for text messages and data apply. Check your plan if you are unsure.</p>

<h2>How to stop</h2>
<div className="sample">Reply STOP to any message.</div>
<p>You will receive one confirmation message and then no further messages from that business through this program. <strong>UNSUBSCRIBE</strong>, <strong>CANCEL</strong>, <strong>END</strong> and <strong>QUIT</strong> work the same way. Opt-out requests are honoured immediately and recorded so they continue to be honoured.</p>
<p>Stopping messages does not prevent the business from returning your call by telephone.</p>

<h2>How to get help</h2>
<div className="sample">Reply HELP to any message.</div>
<p>You will receive a reply identifying the business and how to reach it. You may also contact us:</p>
<p><a href="mailto:support@ringwrench.com"><span className="fill">support@[DOMAIN]</span></a> · <span className="fill">[PHONE]</span></p>

<h2>Carriers</h2>
<p><strong>Carriers are not liable for delayed or undelivered messages.</strong> Delivery depends on your mobile carrier's network and is not guaranteed. This program is supported on major US carriers; carrier participation may change without notice.</p>

<h2>Eligibility</h2>
<p>This program is intended for people aged 18 or over located in the United States, contacting a participating business about a service enquiry.</p>

<h2>Privacy</h2>
<p>We collect your telephone number, the content of your messages, and any photograph you choose to send, in order to prepare a job card for the business you called.</p>
<div className="note">
  <p><strong>No mobile information — including your telephone number, your opt-in status, or the content of your messages — is sold, rented, or shared with any third party or affiliate for that third party's marketing or promotional purposes.</strong> This information is shared only with the business you telephoned and with the service providers strictly necessary to deliver the messages.</p>
</div>
<p>Full detail is in our <a href="/ringwrench/privacy">Privacy Policy</a>.</p>
<p><strong>Please do not send payment card details, bank details, identification numbers or health information by text.</strong> We never ask for them.</p>

<h2>Not for emergencies</h2>
<p>This program must not be used to report an emergency. <strong>If you smell gas, suspect a carbon-monoxide leak, or face fire, flooding or any risk to life or property, hang up and call 911 or your utility's emergency line.</strong> Automated text messages are not monitored continuously and must not be relied on in an emergency.</p>

<h2>Quick reference</h2>
<table>
  <tr><th>Program</th><td>Ring Wrench Missed-Call Reply</td></tr>
  <tr><th>Operator</th><td>ApexElement LLC</td></tr>
  <tr><th>Message type</th><td>Conversational / customer care — no marketing</td></tr>
  <tr><th>Consent</th><td>Your inbound call to the business</td></tr>
  <tr><th>Frequency</th><td>Varies; typically under 10 messages per enquiry</td></tr>
  <tr><th>Cost</th><td>Message and data rates may apply</td></tr>
  <tr><th>Opt out</th><td>Reply STOP</td></tr>
  <tr><th>Help</th><td>Reply HELP, or <span className="fill">support@[DOMAIN]</span></td></tr>
  <tr><th>Privacy</th><td><a href="/ringwrench/privacy">Privacy Policy</a></td></tr>
</table>
      </div>
      <Foot />
    </>
  );
}
