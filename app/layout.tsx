import type { Metadata, Viewport } from 'next'
import { Fraunces, Playfair_Display, Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  // Stealth: HTML <title> stays generic so browser tabs / scrapers that
  // defeat preview-bot carveouts don't see the brand.
  title: '—',
  metadataBase: new URL('https://cultrclub.com'),
  // OpenGraph / Twitter: MATCH join.cultrhealth.com so iMessage, Slack,
  // Twitter, Discord, WhatsApp previews render the same thumbnail +
  // copy. Preview bots (facebookexternalhit, Twitterbot, Slackbot,
  // iMessage) get these tags; search + LLM crawlers are still blocked
  // via robots.txt + noindex.
  openGraph: {
    title: 'Change the CULTR, rebrand yourself.',
    description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health.',
    url: 'https://cultrclub.com',
    siteName: 'CULTR Health',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1536, height: 1024, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Change the CULTR, rebrand yourself.',
    description: 'Order labs, optimize hormones, and unlock your full potential with CULTR Health.',
    images: [{ url: '/twitter-card.png', width: 1536, height: 1024, type: 'image/png' }],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    noimageindex: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  referrer: 'no-referrer',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="bg-brand-cream font-body">
        {children}
        <Script
          id="hs-script-loader"
          src="//js-na2.hs-scripts.com/245823955.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
