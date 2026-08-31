import { headers } from 'next/headers';

// On frontlinepros.apexelement.ai the product is the whole site, so links are
// bare: /privacy, /terms. On apexelement.ai it lives under /frontlinepros.
// Middleware rewrites the subdomain, this keeps the visible URLs clean.
export function productBase() {
  try {
    const host = (headers().get('host') || '').toLowerCase();
    if (host.startsWith('frontlinepros.') || host === 'frontlinepros') return '';
  } catch {
    /* headers() unavailable during static export — fall through */
  }
  return '/frontlinepros';
}
