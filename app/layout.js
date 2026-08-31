import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL('https://www.apexelement.ai'),
  title: 'ApexElement - Next-Gen AI Automation Solutions',
  description: 'Empowering small businesses, creators, and entrepreneurs with cutting-edge artificial intelligence solutions',
  keywords: 'AI automation, artificial intelligence, business automation, AI solutions, machine learning',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}