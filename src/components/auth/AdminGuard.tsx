'use client'

import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: ReactNode
  fallbackPath?: string
}

/**
 * Guard component that only allows admins to access its children.
 * Redirects to fallbackPath (default: '/unauthorized') if not authorized.
 */
export function AdminGuard({ children, fallbackPath = '/unauthorized' }: AdminGuardProps) {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isAdmin = 
    profile?.role === 'admin' || 
    profile?.role === 'admin_main' || 
    profile?.role === 'admin_co'

  useEffect(() => {
    if (!loading && (!profile || !isAdmin)) {
      if (fallbackPath === '/unauthorized') {
        router.replace(`/unauthorized?reason=admin&from=${encodeURIComponent(pathname)}`)
        return
      }
      router.replace(fallbackPath)
    }
  }, [profile, isAdmin, loading, router, fallbackPath, pathname])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Verifiziere Berechtigungen...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
