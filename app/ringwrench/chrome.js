import Link from 'next/link';
import { brand, base } from './brand';

export function Mast() {
  return (
    <header className="mast">
      <div className="shell mast-in">
        <div>
          <Link href={base} className="logo">
            Ring <span>Wrench</span>
          </Link>
          <div className="byline">A product of {brand.LEGAL_ENTITY}</div>
        </div>
        <nav>
          <Link href={`${base}#how`}>How it works</Link>
          <Link href={`${base}#offer`}>Founding offer</Link>
          <Link href={`${base}/contact`}>Contact</Link>
        </nav>
      </div>
    </header>
  );
}

export function Foot() {
  return (
    <footer>
      <div className="shell">
        <div>
          <Link href={`${base}/contact`}>Contact</Link>
          <Link href={`${base}/privacy`}>Privacy Policy</Link>
          <Link href={`${base}/terms`}>Terms of Service</Link>
          <Link href={`${base}/messaging-terms`}>Messaging Terms</Link>
        </div>
        <div className="foot-legal">
          © {brand.YEAR} {brand.LEGAL_ENTITY}. All rights reserved. {brand.NAME} is a product of{' '}
          {brand.LEGAL_ENTITY}.
          <br />
          Not for emergencies. If you smell gas or face fire, flooding or any risk to life,
          call 911 or your utility&rsquo;s emergency line.
        </div>
      </div>
    </footer>
  );
}
