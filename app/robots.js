// The ApexElement site only. FrontlinePros serves its own robots.txt from its
// own domain.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: 'https://www.apexelement.ai/sitemap.xml',
  };
}
