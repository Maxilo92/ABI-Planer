'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RandomCookieBanner } from '@/components/layout/RandomCookieBanner'

interface AppShellProps {
  children: React.ReactNode
}

const authRoutes = new Set(['/login', '/register', '/waiting'])

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthRoute = authRoutes.has(pathname)

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">{children}</main>
        <RandomCookieBanner />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-background md:flex">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <Footer />
      </div>
      <RandomCookieBanner />
    </div>
  )
}
