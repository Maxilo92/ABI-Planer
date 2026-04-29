'use client'

import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface StaffGuardProps {
  children: ReactNode
  fallbackPath?: string
}

/**
 * Guard component that allows admins and planners to access its children.
 * Redirects to fallbackPath (default: '/unauthorized') if not authorized.
 */
export function StaffGuard({ children, fallbackPath = '/unauthorized' }: StaffGuardProps) {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isStaff = 
    profile?.role === 'admin' || 
    profile?.role === 'admin_main' || 
    profile?.role === 'admin_co' ||
    profile?.role === 'planner'

  useEffect(() => {
    if (!loading && (!profile || !isStaff)) {
      if (fallbackPath === '/unauthorized') {
        router.replace(`/unauthorized?reason=staff&from=${encodeURIComponent(pathname)}`)
        return
      }
      router.replace(fallbackPath)
    }
  }, [profile, isStaff, loading, router, fallbackPath, pathname])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Verifiziere Berechtigungen...</p>
      </div>
    )
  }

  if (!isStaff) {
    return null
  }

  return <>{children}</>
}
