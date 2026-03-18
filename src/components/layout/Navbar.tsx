'use client'

import Link from 'next/link'
import { LayoutDashboard, CheckSquare, Calendar, Euro, Megaphone, BarChart2, LogOut, Menu, X, ShieldCheck, User } from 'lucide-react'
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
    { href: '/abstimmungen', label: 'Umfragen', icon: BarChart2 },
  ]

  const isAdmin = profile?.role === 'admin_main' || profile?.role === 'admin_co' || profile?.role === 'admin'

  if (isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin', icon: ShieldCheck })
  }

  const isAuthPage = ['/login', '/register', '/waiting'].includes(pathname)

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U'

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role
  }

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="text-xl font-bold">ABI Planer</span>
            </Link>
          </div>

          {!isAuthPage && !loading && (
            <>
              {/* Desktop Menu */}
              <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href ? 'bg-secondary text-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
                
                <div className="ml-2 pl-4 border-l flex items-center gap-2">
                  {profile ? (
                    <>
                      <Link 
                        href="/profil" 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-secondary transition-colors"
                      >
                        <div className="flex flex-col text-right hidden lg:flex">
                          <span className="text-sm font-semibold leading-none">{profile.full_name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{getRoleLabel(profile.role)}</span>
                        </div>
                        <Avatar size="default">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title="Abmelden">
                        <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                      </Button>
                    </>
                  ) : (
                    <Link 
                      href="/login" 
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Anmelden
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-secondary focus:outline-none"
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {!isAuthPage && isOpen && !loading && (
        <div className="md:hidden border-t bg-background">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                  pathname === item.href ? 'bg-secondary text-primary' : 'hover:bg-secondary'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t">
            {profile ? (
              <>
                <div className="flex items-center px-5 mb-3">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <div className="text-base font-medium">{profile.full_name}</div>
                    <div className="text-sm text-muted-foreground uppercase">{getRoleLabel(profile.role)}</div>
                  </div>
                </div>
                <div className="px-2 space-y-1">
                  <Link
                    href="/profil"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium hover:bg-secondary"
                  >
                    <User className="h-5 w-5" />
                    Profil
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Abmelden
                  </button>
                </div>
              </>
            ) : (
              <div className="px-5">
                <Link 
                  href="/login" 
                  onClick={() => setIsOpen(false)}
                  className={cn(buttonVariants({ variant: "default" }), "w-full justify-center")}
                >
                  Anmelden
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
