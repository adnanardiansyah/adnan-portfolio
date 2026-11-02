import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import TrackVisit from '@/components/TrackVisit';
import { Analytics } from '@vercel/analytics/next';
import NewsletterPopup from '@/components/NewsletterPopup';
import { profile, SITE_URL } from '@/lib/profile';
import { assets } from '@/lib/assets';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap',
});
const title = 'Adnan Ardiansyah — Full-Stack, AI & Infrastructure';
const hasDatabase = Boolean(process.env.DATABASE_URL);

export const viewport = { themeColor: '#090811' };
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: '%s | Adnan Ardiansyah' },
  description: profile.description,
  authors: [{ name: profile.name }],
  creator: profile.name,
  openGraph: {
    title, description: profile.description, siteName: profile.name, type: 'website',
    images: [{ url: assets.openGraph, width: 1200, height: 630, alt: `${profile.name} — Code. Intelligence. Connection.` }],
  },
  twitter: { card: 'summary_large_image', title, description: profile.description, images: [assets.openGraph] },
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  manifest: '/manifest.webmanifest',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION } : {},
  },
  ...(process.env.NEXT_PUBLIC_SITE_URL ? { alternates: { canonical: SITE_URL } } : {}),
};

const jsonLd = {
  '@context': 'https://schema.org', '@type': 'Person',
  name: profile.name, description: profile.description,
  sameAs: [profile.github, profile.linkedin],
  knowsAbout: profile.specializations,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {hasDatabase && <TrackVisit />}
        {children}
        <Analytics />
        {hasDatabase && process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER === 'true' && <NewsletterPopup />}
      </body>
    </html>
  );
}
