export const metadata = {
  title: 'Privacy Policy — ApexElement LLC',
  description:
    'How ApexElement LLC collects, uses and protects personal information, including mobile and SMS data.',
};

export default function PrivacyPage() {
  return (
    <main className="legal">
      <div className="legal-inner">
        <p className="legal-eyebrow">ApexElement LLC</p>
        <h1>Privacy Policy</h1>
        <p className="legal-dates">
          <strong>Effective date:</strong> September 1, 2026
        </p>

        <h2>Who we are</h2>
        <p>
          ApexElement LLC (&ldquo;ApexElement&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a
          limited liability company registered in the State of Florida, United States. We build and
          operate artificial-intelligence software products, including FrontlinePros, a missed-call
          text-back service for home-service businesses.
        </p>
        <p>
          This policy explains what personal information we collect, why we collect it, and what we
          do with it. It applies to <strong>apexelement.ai</strong>, its subdomains, and the products
          we operate.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Information you give us.</strong> Your name, business name, trade, email address
            and telephone number when you complete a contact or sign-up form, and anything you write
            in a message to us.
          </li>
          <li>
            <strong>Messaging information.</strong> Telephone numbers, the content of text messages,
            any photographs sent to us by text, the time messages were sent and received, and
            consent records &mdash; the date and time consent was given and the exact wording shown
            at the time.
          </li>
          <li>
            <strong>Service information.</strong> Records of calls forwarded to our platform,
            including the calling number, the time of the call, and which business was called.
          </li>
          <li>
            <strong>Technical information.</strong> IP address, browser type, pages viewed and
            similar data recorded automatically when you visit our website.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To provide, operate and support our products.</li>
          <li>
            To send the text messages you have asked for, and to reply to enquiries you have started.
          </li>
          <li>
            To prepare job records for the business a customer contacted, so that business can call
            back and schedule service.
          </li>
          <li>To answer your questions, provide support, and send service and billing notices.</li>
          <li>To keep records of consent and opt-outs, which we are required to retain.</li>
          <li>To detect and prevent fraud, abuse and misuse of our systems.</li>
          <li>To meet legal, regulatory and telecommunications-carrier obligations.</li>
        </ul>

        <h2>Mobile information and text messaging</h2>
        <div className="legal-callout">
          <p>
            <strong>
              No mobile information &mdash; including telephone numbers, opt-in status, or the
              content of text messages &mdash; is sold, rented, or shared with any third party or
              affiliate for that third party&rsquo;s marketing or promotional purposes.
            </strong>{' '}
            Text-messaging originator opt-in data and consent are not shared with any third party
            other than the service providers strictly necessary to deliver the messages.
          </p>
        </div>
        <p>
          Where we send messages on behalf of a business you contacted, the details of your enquiry
          are shared with that business so it can serve you. That is the purpose of the service.
        </p>
        <p>
          You can stop receiving messages at any time by replying <strong>STOP</strong>, or get
          assistance by replying <strong>HELP</strong>. Opt-out records are retained so that your
          request continues to be honoured. Message and data rates may apply. Full programme details
          are published in our{' '}
          <a href="https://frontlinepros.apexelement.ai/messaging-terms">Messaging Terms</a>.
        </p>

        <h2>When we share information</h2>
        <p>We do not sell personal information. We share it only:</p>
        <ul>
          <li>
            with the business a customer contacted, so it can respond to that customer&rsquo;s
            enquiry;
          </li>
          <li>
            with service providers who operate our infrastructure under contract &mdash; telephony
            and messaging carriers, hosting, database and analytics providers &mdash; and only as far
            as needed to run the service;
          </li>
          <li>
            where the law requires it, or to establish, exercise or defend legal claims, or to
            protect the safety of any person;
          </li>
          <li>
            with a successor entity in connection with a merger, acquisition or sale of assets, under
            terms consistent with this policy.
          </li>
        </ul>

        <h2>Retention</h2>
        <p>
          We keep personal information for as long as needed to provide the service and to meet our
          legal and regulatory obligations. Consent and opt-out records are kept for as long as we
          operate the messaging programme, because we are required to continue honouring them.
        </p>

        <h2>Security</h2>
        <p>
          We use technical and organisational measures appropriate to the risk, including encryption
          in transit, access controls and least-privilege administration. No system is perfectly
          secure, and we cannot guarantee absolute security.
        </p>
        <p>
          <strong>
            Please do not send payment card numbers, bank details, government identification numbers
            or health information by text message.
          </strong>{' '}
          We never ask for them.
        </p>

        <h2>Your choices and rights</h2>
        <ul>
          <li>Reply STOP to any message to stop receiving texts.</li>
          <li>
            Ask us for a copy of the personal information we hold about you, ask us to correct it, or
            ask us to delete it.
          </li>
          <li>Ask us to stop using your information for a particular purpose.</li>
          <li>
            Depending on where you live, you may have additional rights under state privacy law,
            including the right not to be discriminated against for exercising them.
          </li>
        </ul>
        <p>
          To make a request, email <a href="mailto:hello@apexelement.ai">hello@apexelement.ai</a>. We
          will respond within the time the law allows and may need to verify your identity first.
        </p>

        <h2>Cookies</h2>
        <p>
          Our website uses only what is necessary to serve pages and to understand aggregate traffic.
          You can block cookies in your browser; the site will still work.
        </p>

        <h2>Children</h2>
        <p>
          Our products are intended for people aged 18 or over. We do not knowingly collect personal
          information from children. If you believe a child has given us information, contact us and
          we will delete it.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy. If we make a material change we will update the effective date
          above and, where appropriate, tell you directly.
        </p>

        <h2>Contact us</h2>
        <p>
          ApexElement LLC, Florida, United States
          <br />
          <a href="mailto:hello@apexelement.ai">hello@apexelement.ai</a>
        </p>

        <p className="legal-back">
          <a href="/">&larr; Back to ApexElement</a> &middot; <a href="/terms">Terms of Service</a>
        </p>
      </div>
    </main>
  );
}
