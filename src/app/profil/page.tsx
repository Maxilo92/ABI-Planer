'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Shield, Award, MapPin, Users, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useEffect } from 'react'
import { toDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'
import { useFriendSystem } from '@/hooks/useFriendSystem'

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const { friendships, incomingRequests, outgoingRequests } = useFriendSystem()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?reason=unauthorized')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton className="h-10 w-48" />
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <Skeleton className="h-32 w-full" />
          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6">
              <Skeleton className="w-32 h-32 rounded-3xl border-4 border-card shadow-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
              <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
              <div className="md:col-span-2">
                <Skeleton className="h-96 w-full" />
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

  const userCourse = profile.class_name
  const plannerGroup = profile.planning_groups?.join(', ')
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name || 'User'}`

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    if (role === 'planner') return 'Planer'
    return role
  }

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Dein Profil</h2>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="h-32 bg-slate-900 dark:bg-slate-950"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6">
            <div className="w-32 h-32 bg-muted rounded-3xl border-4 border-card shadow-lg overflow-hidden ring-4 ring-muted">
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black text-foreground">{profile.full_name}</h3>
              <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" /> Gymnasial-Schule am See
              </p>
              <div className="flex gap-2 mt-3">
                <Badge variant={profile.role.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px] font-bold">
                  {getRoleLabel(profile.role)}
                </Badge>
                {userCourse && (
                  <Badge variant="outline" className="uppercase text-[10px] font-bold">
                    Kurs {userCourse}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="font-bold" render={<Link href="/einstellungen">Einstellungen</Link>} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Informationen</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">{getRoleLabel(profile.role)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Mitglied seit {profile.created_at ? format(toDate(profile.created_at), 'MMMM yyyy', { locale: de }) : 'Unbekannt'}
                    </span>
                  </div>
                  {user.emailVerified && (
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Verifiziertes Mitglied</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Freunde</h4>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Freunde</p>
                      <p className="text-lg font-black text-foreground">{friendships.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Anfragen</p>
                      <p className="text-lg font-black text-foreground">{incomingRequests.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Gesendet</p>
                      <p className="text-lg font-black text-foreground">{outgoingRequests.length}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-4 text-xs font-bold text-muted-foreground" render={<Link href="/profil/freunde">Freunde verwalten</Link>} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
              <div>
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-6">Sammelkarten Album</h4>
                <TeacherAlbum initialLimit={6} />
              </div>

              {profile.role === 'planner' && (
                <div>
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Planung</h4>
                  <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-card p-2 rounded-lg shadow-sm">
                      <Users className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Planungsgruppe</p>
                      <p className="text-sm font-black text-foreground">
                        {plannerGroup || 'Noch keiner Gruppe zugewiesen'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
