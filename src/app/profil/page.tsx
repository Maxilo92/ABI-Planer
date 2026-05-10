'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect } from 'react'
import { ProfileView } from '@/components/profile/ProfileView'

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="space-y-6 pb-20 max-w-6xl mx-auto px-4 pt-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <Skeleton className="h-40 w-full" />
          <div className="px-8 pb-8">
            <div className="relative -mt-20 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <Skeleton className="w-36 h-36 sm:w-40 sm:h-40 rounded-[2.5rem] border-8 border-card shadow-lg" />
              <Skeleton className="h-12 w-40 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-64 sm:h-16" />
              <Skeleton className="h-6 w-48 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
              <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-3xl" />
                <Skeleton className="h-48 w-full rounded-3xl" />
              </div>
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full rounded-[2.5rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Dein Profil</h2>
      </div>
      <ProfileView 
        profile={profile} 
        isOwnProfile={true} 
        email={user.email}
        emailVerified={user.emailVerified}
      />
    </div>
  )
}
