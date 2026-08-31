import { brand } from './brand';
import { productBase } from './nav';

export function Mast() {
  const b = productBase();
  return (
    <header className="mast">
      <div className="shell mast-in">
        <a href={b || '/'} className="logo">
          <b>
            Frontline<span>Pros</span>
          </b>
          <em>by {brand.LEGAL_ENTITY}</em>
        </a>
        <nav>
          <a href={`${b}/#how`}>How it works</a>
          <a href={`${b}/#offer`}>Founding offer</a>
          <a href={`tel:${brand.PHONE_E164}`} className="nav-cta">
            Call {brand.PHONE}
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Foot() {
  const b = productBase();
  return (
    <footer>
      <div className="shell foot-grid">
        <div>
          <div className="foot-logo">
            Frontline<span>Pros</span>
          </div>
          <p className="foot-blurb">
            Missed-call textback for appliance repair, HVAC and plumbing shops. A product of{' '}
            {brand.LEGAL_ENTITY}.
          </p>
        </div>
        <div>
          <div className="foot-head">Company</div>
          <a href={`${b}/contact`}>Contact</a>
          <a href="https://www.apexelement.ai" target="_blank" rel="noopener noreferrer">
            ApexElement
          </a>
        </div>
        <div>
          <div className="foot-head">Legal</div>
          <a href={`${b}/privacy`}>Privacy Policy</a>
          <a href={`${b}/terms`}>Terms of Service</a>
          <a href={`${b}/messaging-terms`}>Messaging Terms</a>
        </div>
      </div>
      <div className="shell foot-legal">
        © {brand.YEAR} {brand.LEGAL_ENTITY}. All rights reserved.
        <br />
        <strong>Not for emergencies.</strong> If you smell gas or face fire, flooding or any risk to
        life, hang up and call 911 or your utility&rsquo;s emergency line.
      </div>
    </footer>
  );
}
