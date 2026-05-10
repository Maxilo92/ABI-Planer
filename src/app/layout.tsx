import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/context/AuthContext'
import { SystemMessageProvider } from '@/context/SystemMessageContext'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/context/ThemeProvider'
import { AccentThemeProvider } from '@/context/AccentThemeProvider'
import { LanguageProvider } from '@/context/LanguageContext'
import { GoogleAdSense } from '@/components/layout/GoogleAdSense'
import { AdSenseScript } from '@/components/layout/AdSenseScript'
import { PHProvider } from './providers'

import { faviconLinks } from '@/components/FaviconLinks'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://abi-planer-27.de'),
  title: {
    default: 'ABI Planer | Der Abiball-Planer',
    template: '%s | ABI Planer'
  },
  description: 'Die All-in-One Lösung für euren Abiball: Finanzplanung, Abstimmungen, Aufgabenverwaltung und das digitale Lehrer-Sammelalbum.',
  openGraph: {
    title: 'ABI Planer | Der Abiball-Planer',
    description: 'Die All-in-One Lösung für euren Abiball: Finanzplanung, Abstimmungen, Aufgabenverwaltung und das digitale Lehrer-Sammelalbum.',
    url: './',
    siteName: 'ABI Planer',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'ABI Planer Logo',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABI Planer | Der Abiball-Planer',
    description: 'Die All-in-One Lösung für euren Abiball: Finanzplanung, Abstimmungen, Aufgabenverwaltung und das digitale Lehrer-Sammelalbum.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="h-full" suppressHydrationWarning>
      <head>
        {/* Favicon und Logo */}
        {faviconLinks}
      </head>
      <body className={`${inter.variable} font-sans antialiased h-full bg-background`}>
        {/* Optional: Logo prominent platzieren */}
        {/* <Logo width={250} height={100} style={{ display: 'block', margin: '2rem auto 0 auto' }} /> */}
        <PHProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AccentThemeProvider>
              <AuthProvider>
                <LanguageProvider>
                  <SystemMessageProvider>
                    <AdSenseScript />
                    <AppShell>{children}</AppShell>
                    <GoogleAdSense />
                    <Toaster />
                  </SystemMessageProvider>
                </LanguageProvider>
              </AuthProvider>
            </AccentThemeProvider>
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  )
}
