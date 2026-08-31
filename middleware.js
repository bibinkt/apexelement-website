import { NextResponse } from 'next/server';

// Serve the FrontlinePros product site at frontlinepros.apexelement.ai
// while it lives at /frontlinepros inside this project.
//
// Requests to the subdomain are rewritten so the URL bar stays clean:
//   frontlinepros.apexelement.ai/          -> /frontlinepros
//   frontlinepros.apexelement.ai/privacy   -> /frontlinepros/privacy
//
// The /frontlinepros/* paths keep working on the apex domain too, so
// Vercel previews and direct links are unaffected.

const PRODUCT_HOST = 'frontlinepros';
const PRODUCT_PATH = '/frontlinepros';

export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname, search } = request.nextUrl;

  const isProductHost =
    host.startsWith(`${PRODUCT_HOST}.`) || host === PRODUCT_HOST;

  if (!isProductHost) return NextResponse.next();

  // already pointed at the product tree — leave it alone
  if (pathname === PRODUCT_PATH || pathname.startsWith(`${PRODUCT_PATH}/`)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? PRODUCT_PATH : `${PRODUCT_PATH}${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // skip static assets and Next internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)).*)'],
};
