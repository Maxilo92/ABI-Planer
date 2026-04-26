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
  title: 'ABI Planer',
  description: 'Zentrale Plattform für die Planung des Abiballs',
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
