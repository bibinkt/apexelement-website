// FrontlinePros lives at frontlinepros.ai now, with its own sitemap. Listing
// its pages here would be this site claiming pages it does not serve.
const APEX = 'https://www.apexelement.ai';

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${APEX}/`, lastModified: now, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${APEX}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APEX}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
