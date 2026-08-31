const FP = 'https://frontlinepros.apexelement.ai';
const APEX = 'https://www.apexelement.ai';

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${FP}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${FP}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${FP}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${FP}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${FP}/messaging-terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APEX}/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APEX}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APEX}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
