// Served on both hosts: middleware's matcher excludes .txt, so the subdomain
// gets this file too rather than a rewritten 404.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nothing behind a login, and the test bench, should be indexed.
        disallow: ['/dashboard', '/dashboard/', '/join', '/test', '/api/', '/admin'],
      },
    ],
    sitemap: 'https://frontlinepros.apexelement.ai/sitemap.xml',
  };
}
