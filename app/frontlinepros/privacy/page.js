import { brand } from '../brand';
import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';

export const metadata = { title: 'Privacy Policy — ' + brand.NAME };

export default function Page() {
  const b = productBase();
  return (
    <>
      <Mast />
      <div className="shell narrow doc">
        <div className="doc-head">
          <div className="kicker">{brand.NAME}</div>
          <h1>Privacy Policy</h1>
        </div>
<p className="dates"><strong>Effective date:</strong> {brand.EFFECTIVE_DATE} &nbsp;·&nbsp; <strong>Last updated:</strong> {brand.EFFECTIVE_DATE}</p>

<div className="note">
  <p><strong>Short version.</strong> FrontlinePros answers calls your shop misses by texting the caller back from the line dedicated to your business, which names your business in the first message. To do that we handle the caller's phone number, what they tell us about the broken equipment, and any photo they send.</p>
  <p><strong>We do not sell personal information. We do not share phone numbers, text-message content, or opt-in data with third parties for their own marketing, and we never will.</strong></p>
</div>

<h2>1. Who we are</h2>
<p>FrontlinePros is a service operated by <strong>ApexElement LLC</strong> ("FrontlinePros", "we", "us", "our"), a limited liability company registered in {brand.STATE}, United States.</p>
<p><strong>Privacy contact:</strong> <a href="mailto:hello@apexelement.ai">{brand.EMAIL}</a><br />
You can also reach us through the <a href={`${b}/contact`}>contact form</a> on this site.</p>

<h2>2. Two kinds of people this policy covers</h2>
<p>FrontlinePros sits between a service business and the people who call it, so this policy covers two separate groups. Your rights differ slightly depending on which one you are.</p>
<table>
  <tr><th style={{width: '26%'}}>Who</th><th>What that means</th></tr>
  <tr>
    <td><strong>Subscribers</strong></td>
    <td>The repair, HVAC or plumbing business that signs up for FrontlinePros. You have an account with us and a contract with us.</td>
  </tr>
  <tr>
    <td><strong>Callers</strong></td>
    <td>A member of the public who telephones a Subscriber's business, is not answered, and receives an automated text back from the line dedicated to that business. You do not have an account with us. We process your information on the Subscriber's instructions.</td>
  </tr>
</table>
<p>For Callers, the Subscriber is the <strong>controller</strong> of the information and FrontlinePros acts as its <strong>service provider / processor</strong>. If you are a Caller and want your information deleted, you may contact us directly (see section 10) and we will act on it.</p>

<h2>3. Information we collect</h2>

<h3>3.1 From Subscribers</h3>
<ul>
  <li>Business name, contact name, business address, email address and telephone number.</li>
  <li>Business telephone number and call-forwarding configuration.</li>
  <li>Billing information. Card details are handled by our payment processor; <strong>we do not store full card numbers on our systems.</strong></li>
  <li>Account activity — logins, settings changes, and support correspondence.</li>
</ul>

<h3>3.2 From Callers</h3>
<ul>
  <li><strong>Telephone number</strong> — captured from the inbound call to the Subscriber's business line.</li>
  <li><strong>Date, time and duration</strong> of the unanswered call.</li>
  <li><strong>Text message content</strong> — the replies you send describing the fault, and our messages to you.</li>
  <li><strong>Photographs you choose to send</strong>, typically of an equipment data plate, together with any information visible in them (brand, model number, serial number) and any metadata attached to the file.</li>
  <li><strong>Service address</strong> and name, where you provide them.</li>
</ul>
<p>We ask only for information needed to prepare a job card. <strong>Please do not send payment card details, bank details, government identification numbers, or health information by text.</strong> We do not ask for them and do not need them.</p>

<h3>3.3 Collected automatically</h3>
<ul>
  <li>Message delivery status and carrier routing information supplied by our messaging provider.</li>
  <li>Standard web log data if you visit our website — IP address, browser type, pages viewed.</li>
</ul>

<h2>4. How we use information</h2>
<table>
  <tr><th style={{width: '44%'}}>Purpose</th><th>Legal basis</th></tr>
  <tr><td>Sending an automated reply text after an unanswered call, and exchanging follow-up messages</td><td>Performance of our contract with the Subscriber; the Subscriber's legitimate interest in responding to an enquiry it received</td></tr>
  <tr><td>Reading an equipment data plate from a submitted photo to extract brand, model and serial</td><td>Performance of the service requested</td></tr>
  <tr><td>Preparing and delivering the job card to the Subscriber</td><td>Performance of the service requested</td></tr>
  <tr><td>Billing, accounting and tax records</td><td>Contract and legal obligation</td></tr>
  <tr><td>Fraud prevention, abuse prevention and security</td><td>Legitimate interest and legal obligation</td></tr>
  <tr><td>Maintaining opt-out records so we do not text someone who asked us to stop</td><td>Legal obligation (TCPA / CTIA)</td></tr>
</table>

<h3>4.1 Automated processing</h3>
<p>FrontlinePros uses automated systems, including machine-learning models, to read text messages and photographs in order to extract equipment details and compose the job card. <strong>These systems do not make decisions that produce legal or similarly significant effects about any person.</strong> They summarise a service enquiry for a tradesperson to act on. If a data plate cannot be read reliably, the system reports that it could not read it rather than guessing.</p>

<h2>5. We do not sell your information</h2>
<div className="note">
  <p><strong>No mobile information — including telephone numbers, opt-in status, or the content of text messages — is sold, rented, or shared with any third party or affiliate for that third party's own marketing or promotional purposes.</strong></p>
  <p>Text-message originator opt-in data and consent are <strong>not</strong> shared with any third party except the subcontracted service providers listed below who are strictly necessary to deliver the messaging service itself, and who are contractually prohibited from using it for their own purposes.</p>
</div>
<p>We do not "sell" or "share" personal information as those terms are defined under the California Consumer Privacy Act, and we have not done so in the preceding twelve months. We do not use personal information for cross-context behavioural advertising.</p>

<h2>6. Who we disclose information to</h2>
<ul>
  <li><strong>The Subscriber</strong> whose business line the Caller telephoned. This is the purpose of the service — the job card goes to that business.</li>
  <li><strong>Messaging and telecommunications providers</strong> who transmit the messages (for example Twilio) and the mobile carriers required to deliver them.</li>
  <li><strong>Cloud hosting and infrastructure providers</strong> who store the data on our behalf.</li>
  <li><strong>Artificial-intelligence processing providers</strong> used to extract equipment details from photographs and messages, under agreements that prohibit them from using the data to train their models for other purposes.</li>
  <li><strong>Payment processors</strong>, for Subscriber billing only.</li>
  <li><strong>Professional advisers</strong> (accountants, lawyers, insurers) where reasonably required.</li>
  <li><strong>Law enforcement or regulators</strong>, where we are legally compelled, or to protect the rights, property or safety of any person.</li>
  <li><strong>A successor entity</strong> in the event of a merger, acquisition or sale of assets, subject to this policy continuing to apply.</li>
</ul>
<p>All processors act on our documented instructions under written agreements.</p>

<h2>7. Text messaging, consent and opt-out</h2>
<p><strong>Why you receive a message.</strong> A Caller receives a text only because that Caller telephoned a Subscriber's business and the call was not answered. The unanswered call is forwarded by the business's own telephone carrier to the FrontlinePros line assigned to that business, and the reply is sent from that line. That line is assigned to that business alone and is not shared with any other Subscriber. The first message identifies the business by name. The message is a direct reply to an enquiry the Caller initiated. It is transactional and relates solely to the service enquiry.</p>
<ul>
  <li><strong>We do not send marketing or promotional text messages to Callers.</strong></li>
  <li><strong>We do not add Caller numbers to any marketing list.</strong></li>
  <li><strong>We do not text numbers that have not called the Subscriber's business.</strong></li>
</ul>
<p><strong>Opting out.</strong> Reply <strong>STOP</strong> to any message to stop all further messages from that business immediately. You may also reply UNSUBSCRIBE, CANCEL, END or QUIT. You will receive one confirmation message and then nothing further. Reply <strong>HELP</strong> for assistance, or contact the business directly.</p>
<p>Message and data rates may apply. Message frequency varies and depends on the exchange required to describe the fault; a typical enquiry involves fewer than ten messages. Carriers are not liable for delayed or undelivered messages.</p>
<p>Opt-out requests are recorded and honoured indefinitely. We retain a record of the opt-out itself precisely so that we can continue to honour it.</p>

<p><strong>Messages to business owners.</strong> Separately from the above, we send marketing text messages to owners and managers of home-service businesses who have asked to receive them by ticking a standalone marketing consent box on our <a href={`${b}/contact`}>contact page</a>. That box is not ticked by default, ticking it is optional, and it is never a condition of any purchase. We record the number, the date and time, and the exact consent wording shown at the time. Those messages go out about two to four times a month, and STOP and HELP work exactly as described above. That programme is described in full as Program A in our <a href={`${b}/messaging-terms`}>Messaging Terms</a>; the missed-call replies described above are Program B. The two are separate programmes with separate consent, and opting into one never opts you into the other.</p>

<h2>8. How long we keep information</h2>
<table>
  <tr><th style={{width: '46%'}}>Category</th><th>Retention</th></tr>
  <tr><td>Caller messages, photographs and job cards</td><td>{brand.RETENTION_MESSAGES} from the date of the enquiry, unless the Subscriber deletes them sooner or the Caller requests deletion</td></tr>
  <tr><td>Opt-out (STOP) records</td><td>Retained indefinitely, so the request continues to be honoured</td></tr>
  <tr><td>Subscriber account records</td><td>Duration of the subscription plus {brand.RETENTION_ACCOUNT}</td></tr>
  <tr><td>Billing and tax records</td><td>As required by law, typically seven years</td></tr>
</table>

<h2>9. Security</h2>
<p>We use encryption in transit (TLS), encryption at rest for stored messages and photographs, access controls limiting staff access to those who need it, and logging of administrative access. No system is perfectly secure, and we cannot guarantee absolute security, but we will notify affected people and any required regulator of a breach involving personal information as required by applicable law.</p>

<h2>10. Your rights and choices</h2>
<p>Depending on where you live, you may have the right to:</p>
<ul>
  <li><strong>Know</strong> what personal information we hold about you and how we use it.</li>
  <li><strong>Access</strong> a copy of it.</li>
  <li><strong>Correct</strong> information that is inaccurate.</li>
  <li><strong>Delete</strong> it, subject to records we must keep by law (such as opt-out records and tax records).</li>
  <li><strong>Opt out</strong> of sale or sharing — though as stated above, we do not sell or share personal information.</li>
  <li><strong>Not be discriminated against</strong> for exercising any of these rights.</li>
</ul>
<p>To exercise any right, email us at <a href="mailto:hello@apexelement.ai">{brand.EMAIL}</a> or use the contact form on our site. We will verify your identity — usually by confirming control of the telephone number or email address in question — and respond within the period required by law (generally 45 days in the United States). You may use an authorised agent.</p>
<p>If you are a Caller, you may also ask the business you telephoned to delete your enquiry, and we will act on their instruction.</p>

<h2>11. Children</h2>
<p>FrontlinePros is a business service and is not directed to children. We do not knowingly collect personal information from anyone under 18. If we learn that we have, we will delete it.</p>

<h2>12. Where information is processed</h2>
<p>We process and store information in the United States. If you contact a Subscriber from outside the United States, your information will be transferred to and processed in the United States, which may have different data-protection laws than your country.</p>

<h2>13. Third-party links</h2>
<p>Our website may link to other sites. We are not responsible for their content or privacy practices, and this policy does not apply to them.</p>

<h2>14. Changes to this policy</h2>
<p>We may update this policy. We will change the "last updated" date above, and for material changes affecting Subscribers we will give notice by email or in the product at least {brand.NOTICE_DAYS} days before the change takes effect. Continuing to use the service after a change takes effect means you accept the updated policy.</p>

<h2>15. Contact</h2>
<p>Questions, requests or complaints:<br />
<strong>ApexElement LLC — FrontlinePros</strong><br />
<a href="mailto:hello@apexelement.ai">{brand.EMAIL}</a><br />
Or use the <a href={`${b}/contact`}>contact form</a> on this site.</p>
      </div>
      <Foot />
    </>
  );
}
