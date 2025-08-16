import './globals.css'

export const metadata = {
  title: 'ApexElement - Next-Gen AI Automation Solutions',
  description: 'Empowering small businesses, creators, and entrepreneurs with cutting-edge artificial intelligence solutions',
  keywords: 'AI automation, artificial intelligence, business automation, AI solutions, machine learning',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  )
}