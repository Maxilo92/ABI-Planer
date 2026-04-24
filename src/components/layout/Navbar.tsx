'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardNavbar } from './DashboardNavbar'
import { TcgNavbar } from './TcgNavbar'
import { ShopNavbar } from './ShopNavbar'
import { isTcgHost, isDashboardHost, isShopHost } from '@/lib/dashboard-url'

export function Navbar() {
  const pathname = usePathname()

  const { isTcgDomain, isDashboardDomain, isShopDomain } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isTcgDomain: false, isDashboardDomain: false, isShopDomain: false }
    }
    const host = window.location.hostname
    return {
      isTcgDomain: isTcgHost(host),
      isDashboardDomain: isDashboardHost(host),
      isShopDomain: isShopHost(host)
    }
  }, [])

  // Area detection: Subdomain strictly defines the navbar.
  // If no known subdomain is active, fall back to path detection.
  
  if (isShopDomain) return <ShopNavbar />
  if (isTcgDomain) return <TcgNavbar />
  if (isDashboardDomain) return <DashboardNavbar />

  // Fallback for landing page paths (if accessed via path on main domain)
  if (pathname.startsWith('/shop')) return <ShopNavbar />
  if (pathname.startsWith('/sammelkarten') || 
      pathname.startsWith('/album') || 
      pathname.startsWith('/battle-pass') || 
      pathname.startsWith('/home') || 
      pathname.startsWith('/booster')) {
    return <TcgNavbar />
  }

  return <DashboardNavbar />
}
