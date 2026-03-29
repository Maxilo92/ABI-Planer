import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/context/AuthContext'
import { SystemMessageProvider } from '@/context/SystemMessageContext'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/context/ThemeProvider'
import { GoogleAdSense } from '@/components/layout/GoogleAdSense'

import { faviconLinks } from '@/components/FaviconLinks'
import Logo from '@/components/Logo'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'ABI Planer',
  description: 'Zentrale Plattform für die Planung des Abiturs',
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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940687842344229"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${inter.variable} font-sans antialiased h-full bg-background`}>
        {/* Optional: Logo prominent platzieren */}
        {/* <Logo width={250} height={100} style={{ display: 'block', margin: '2rem auto 0 auto' }} /> */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SystemMessageProvider>
              <AppShell>{children}</AppShell>
              <GoogleAdSense />
              <Toaster />
            </SystemMessageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
