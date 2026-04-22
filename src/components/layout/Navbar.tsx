'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardNavbar } from './DashboardNavbar'
import { TcgNavbar } from './TcgNavbar'
import { ShopNavbar } from './ShopNavbar'

export function Navbar() {
  const pathname = usePathname()

  const { isTcgDomain, isDashboardDomain, isShopDomain } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isTcgDomain: false, isDashboardDomain: false, isShopDomain: false }
    }
    const host = window.location.hostname
    const tcg = host.startsWith('tcg.') || host.includes('.tcg.')
    const dashboard = host.startsWith('dashboard.') || host.startsWith('app.') || host.includes('.dashboard.')
    const shop = host.startsWith('shop.') || host.includes('.shop.')
    return {
      isTcgDomain: tcg,
      isDashboardDomain: dashboard,
      isShopDomain: shop
    }
  }, [])

  // Area detection based on domain or path
  const isShopArea = isShopDomain || pathname.startsWith('/shop')
  const isTcgArea = isTcgDomain || pathname.startsWith('/sammelkarten') || pathname.startsWith('/album') || pathname.startsWith('/battle-pass') || pathname.startsWith('/home') || pathname.startsWith('/booster')
  const isDashboardArea = isDashboardDomain || (!isShopArea && !isTcgArea)

  if (isShopArea) {
    return <ShopNavbar />
  }

  if (isTcgArea) {
    return <TcgNavbar />
  }

  return <DashboardNavbar />
}
