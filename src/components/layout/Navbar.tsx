'use client'

import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Calendar, Euro, Megaphone, BarChart2, LogOut, Menu, X, ShieldCheck, User, MessageSquareHeart, Settings } from 'lucide-react'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut(auth)
    setIsOpen(false)
    router.push('/login')
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/todos', label: 'Todos', icon: CheckSquare },
    { href: '/kalender', label: 'Kalender', icon: Calendar },
    { href: '/finanzen', label: 'Finanzen', icon: Euro },
    { href: '/news', label: 'News', icon: Megaphone },
    { href: '/feedback', label: 'Feedback', icon: MessageSquareHeart },
    { href: '/abstimmungen', label: 'Umfragen', icon: BarChart2 },
    { href: '/einstellungen', label: 'Einstellungen', icon: Settings },
  ]

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  if (isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin', icon: ShieldCheck })
    navItems.push({ href: '/admin/feedback', label: 'Feedback Admin', icon: MessageSquareHeart })
  }

  const isAuthPage = ['/login', '/register', '/waiting'].includes(pathname)

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U'

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  if (isAuthPage) {
    return null
  }

  return (
    <>
      {/* Mobile top bar */}
      {!loading && (
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur-sm">
          <div className="h-full px-4 flex items-center justify-between">
            <Link href="/" className="font-extrabold text-xl tracking-tight">
              ABI Planer
            </Link>
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-secondary"
              aria-label="Navigation oeffnen"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>
      )}

      {/* Mobile spacer so content is not hidden under fixed top bar */}
      {!loading && <div className="md:hidden h-16" />}

      {/* Mobile drawer */}
      {!loading && isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} aria-label="Navigation schliessen" />
          <aside className="absolute left-0 top-16 bottom-0 w-80 max-w-[85vw] border-r bg-background p-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.href) ? 'bg-secondary text-primary' : 'hover:bg-secondary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t space-y-2">
              {profile ? (
                <>
                  <Link
                    href="/profil"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-secondary"
                  >
                    <Avatar size="default">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold leading-none truncate">{profile.full_name}</div>
                      <div className="text-xs text-muted-foreground uppercase mt-1">{getRoleLabel(profile.role)}</div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)} className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}>
                  Anmelden
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      {!loading && (
        <aside className="hidden md:flex md:sticky md:top-0 md:h-screen md:shrink-0 w-72 border-r bg-background/95 backdrop-blur-sm flex-col">
          <div className="h-16 border-b px-5 flex items-center">
            <Link href="/" className="font-extrabold text-2xl tracking-tight">
              ABI Planer
            </Link>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.href) ? 'bg-secondary text-primary' : 'hover:bg-secondary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t">
            {profile ? (
              <>
                <Link href="/profil" className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-secondary transition-colors">
                  <Avatar size="default">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{profile.full_name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{getRoleLabel(profile.role)}</div>
                  </div>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 mt-2 text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </Button>
              </>
            ) : (
                <Link href="/login" className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}>
                  Anmelden
                </Link>
            )}
          </div>
        </aside>
      )}
    </>
  )
}
