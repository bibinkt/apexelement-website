import { NextResponse } from 'next/server';

// FrontlinePros has moved to its own domain and its own repository.
//
// This used to rewrite frontlinepros.apexelement.ai onto /frontlinepros inside
// this project. Now it redirects there permanently instead: the pages are gone
// from this codebase, and a 301 hands the accumulated search ranking to the new
// domain rather than stranding it on a host that 404s.
//
// Paths are preserved, so /privacy on the old subdomain lands on /privacy at
// the new one. Both hosts are covered — the subdomain and the old
// apexelement.ai/frontlinepros/* paths.

const OLD_HOST = 'frontlinepros';
const OLD_PATH = '/frontlinepros';
const NEW_ORIGIN = 'https://frontlinepros.ai';

export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname, search } = request.nextUrl;

  const fromSubdomain = host.startsWith(`${OLD_HOST}.`) || host === OLD_HOST;
  const fromPath = pathname === OLD_PATH || pathname.startsWith(`${OLD_PATH}/`);
  if (!fromSubdomain && !fromPath) return NextResponse.next();

  const rest = fromPath ? pathname.slice(OLD_PATH.length) || '/' : pathname;
  return NextResponse.redirect(`${NEW_ORIGIN}${rest}${search}`, 301);
}

export const config = {
  // Skip static assets and Next internals, as before.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)).*)'],
};
