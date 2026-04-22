'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, BarChart2, Settings, Server, CheckCircle2 } from 'lucide-react'
import { AdminSystemProvider } from '@/components/admin/AdminSystemContext'

export default function AdminSystemLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'admin_main' || profile?.role === 'admin_co'

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === '/admin/system/analytics') return 'analytics'
    if (pathname === '/admin/system/control') return 'control'
    if (pathname === '/admin/system/check') return 'check'
    return 'overview'
  }

  const handleTabChange = (value: string) => {
    if (value === 'analytics') router.push('/admin/system/analytics')
    else if (value === 'control') router.push('/admin/system/control')
    else if (value === 'check') router.push('/admin/system/check')
    else router.push('/admin/system')
  }

  if (authLoading) return null

  if (!isAdmin) {
    router.replace('/unauthorized')
    return null
  }

  return (
    <AdminSystemProvider>
      <div className="container mx-auto px-3 py-6 sm:px-6 sm:py-8 space-y-8 pb-24">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Server className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              System Control Center
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground break-words">
              Zentrale Steuerung, Live-Status und Nutzungsanalyse der gesamten ABI Planer Infrastruktur.
            </p>
          </div>
        </div>

        <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-fit mb-8 h-12 p-1 bg-muted/50 border shadow-sm">
            <TabsTrigger value="overview" className="h-full gap-2 px-6 font-black uppercase tracking-widest text-[10px]">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="analytics" className="h-full gap-2 px-6 font-black uppercase tracking-widest text-[10px]">
              <BarChart2 className="w-3.5 h-3.5" />
              Live-Analyse
            </TabsTrigger>
            <TabsTrigger value="control" className="h-full gap-2 px-6 font-black uppercase tracking-widest text-[10px]">
              <Settings className="w-3.5 h-3.5" />
              System-Steuerung
            </TabsTrigger>
            <TabsTrigger value="check" className="h-full gap-2 px-6 font-black uppercase tracking-widest text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Funktions-Check
            </TabsTrigger>
          </TabsList>
          {children}
        </Tabs>
      </div>
    </AdminSystemProvider>
  )
}
