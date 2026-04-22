'use client'

import Link from 'next/link'
import { ShoppingBag, User, LogOut, Menu, X, ShoppingCart, Sparkles, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getFirebaseAuth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import { getTcgBaseUrl, getDashboardBaseUrl } from '@/lib/dashboard-url'

const auth = getFirebaseAuth()

export function ShopNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()
  const tcgUrl = getTcgBaseUrl()
  const dashboardUrl = getDashboardBaseUrl()

  const handleSignOut = async () => {
    await signOut(auth)
    setIsOpen(false)
    router.push('/login')
  }

  const userInitial = profile?.full_name?.substring(0, 1).toUpperCase() || 'U'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-3">
          <Logo width={40} height={40} />
          <span className="font-extrabold text-xl tracking-tight hidden sm:inline-block">ABI Shop</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/shop?category=sammelkarten" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Sammelkarten
          </Link>
          <Link href="/shop?category=merch" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Merch
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="Warenkorb">
            <ShoppingCart className="h-5 w-5" />
            {/* Cart Badge could be added here */}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-3 ml-4">
              <Link href="/profil" className="flex items-center gap-2 hover:bg-secondary rounded-full pl-1 pr-3 py-1 transition-colors">
                <Avatar size="sm"><AvatarFallback className="text-[10px]">{userInitial}</AvatarFallback></Avatar>
                <span className="text-sm font-medium">{profile?.full_name?.split(' ')[0]}</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Abmelden">
                <LogOut className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
              Anmelden
            </Link>
          )}

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-secondary">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden absolute top-16 left-0 right-0 bg-background border-b shadow-lg p-4 flex flex-col gap-4">
            <Link href="/shop?category=sammelkarten" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg font-medium">
              <Sparkles className="h-5 w-5" /> Sammelkarten
            </Link>
            <Link href="/shop?category=merch" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg font-medium">
              <ShoppingBag className="h-5 w-5" /> Merch
            </Link>
            <hr />
            {user ? (
              <>
                <Link href="/profil" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg font-medium">
                  <User className="h-5 w-5" /> Profil
                </Link>
                <Link href={`${tcgUrl}/home`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg font-medium">
                  <Sparkles className="h-5 w-5" /> Zum TCG Bereich
                </Link>
                <Button variant="ghost" className="justify-start gap-3 p-3 text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" /> Abmelden
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center p-3 bg-primary text-primary-foreground rounded-lg font-bold">
                Anmelden
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
