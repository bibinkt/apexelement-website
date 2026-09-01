import { brand } from './brand';
import './fp.css';

const SITE = 'https://frontlinepros.apexelement.ai';
const TITLE = `${brand.NAME} — An AI front desk for the trades`;
const DESC =
  'An AI assistant that answers the calls your shop can\'t reach. It knows your trade, asks ' +
  'what a good technician would ask, reads the model number off a photo, and hands you a written ' +
  'job card — for appliance repair, HVAC and plumbing shops. $10 a month, cancel any time.';

export const metadata = {
  metadataBase: new URL(SITE),
  // FP mark: F in cream, P in the accent. The apex site's lightning bolt was
  // being inherited here, which is the wrong product entirely.
  icons: { icon: [{ url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%2315150e'/><text x='32' y='45' font-family='Helvetica,Arial,sans-serif' font-size='34' font-weight='700' text-anchor='middle'><tspan fill='%23fcfbf7'>F</tspan><tspan fill='%23e2703f'>P</tspan></text></svg>", type: 'image/svg+xml' }] },
  title: {
    default: TITLE,
    // Child pages set their own title; this keeps the brand on the end of it.
    template: `%s — ${brand.NAME}`,
  },
  description: DESC,
  applicationName: brand.NAME,
  keywords: [
    'missed call text back',
    'missed call textback service',
    'appliance repair software',
    'HVAC missed calls',
    'plumbing answering service',
    'service business phone',
    'job card',
    'Florida',
  ],
  authors: [{ name: brand.LEGAL_ENTITY }],
  creator: brand.LEGAL_ENTITY,
  publisher: brand.LEGAL_ENTITY,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: brand.NAME,
    title: TITLE,
    description: DESC,
    url: SITE,
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${brand.NAME} — missed-call textback for the trades` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: true },
};

// Structured data. Service + Organization, so the trade, the area served and the
// operating company are machine-readable rather than inferred from prose.
const JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: brand.NAME,
      legalName: brand.LEGAL_ENTITY,
      url: SITE,
      email: brand.EMAIL,
      parentOrganization: { '@type': 'Organization', name: brand.LEGAL_ENTITY, url: 'https://www.apexelement.ai' },
      address: { '@type': 'PostalAddress', addressRegion: 'FL', addressCountry: 'US' },
    },
    {
      '@type': 'Service',
      '@id': `${SITE}/#service`,
      name: 'Missed-call textback for home-service businesses',
      serviceType: 'Missed-call textback and job intake',
      provider: { '@id': `${SITE}/#org` },
      areaServed: { '@type': 'Country', name: 'United States' },
      audience: {
        '@type': 'BusinessAudience',
        audienceType: 'Appliance repair, HVAC and plumbing businesses',
      },
      description: DESC,
      offers: {
        '@type': 'Offer',
        price: brand.PRICE.replace('$', ''),
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: brand.PRICE.replace('$', ''),
          priceCurrency: 'USD',
          unitText: 'MONTH',
        },
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: brand.NAME,
      publisher: { '@id': `${SITE}/#org` },
      inLanguage: 'en-US',
    },
  ],
};

export default function RwLayout({ children }) {
  return (
    <div className="rw">
      <script
        type="application/ld+json"
        // Static object we author; nothing user-supplied reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }}
      />
      {children}
    </div>
  );
}
