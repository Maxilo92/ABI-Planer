import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/context/AuthContext'
import { SystemMessageProvider } from '@/context/SystemMessageContext'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/context/ThemeProvider'
import { GoogleAdSense } from '@/components/layout/GoogleAdSense'

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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940687842344229"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${inter.variable} font-sans antialiased h-full bg-background`}>
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
