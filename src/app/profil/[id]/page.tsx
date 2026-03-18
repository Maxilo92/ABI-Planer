'use client'

import { useEffect, useState, use } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Profile, UserRole } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Mail, Shield, Calendar, Users, User } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profiles', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setTargetProfile({ id: docSnap.id, ...docSnap.data() } as Profile)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Profil nicht gefunden.</h2>
        <Button
          variant="link"
          className="mt-4"
          render={<Link href="/news">Zurück zur Übersicht</Link>}
        />
      </div>
    )
  }

  const userInitial = targetProfile.full_name?.substring(0, 1).toUpperCase() || 'U'

  const getRoleLabel = (role: UserRole) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role === 'planner' ? 'Planer' : 'Zuschauer'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2 text-muted-foreground"
        render={
          <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Link>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b pb-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <CardTitle className="text-2xl">{targetProfile.full_name}</CardTitle>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant={targetProfile.role.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px]">
                {getRoleLabel(targetProfile.role)}
              </Badge>
              {targetProfile.class_name && (
                <Badge variant="outline" className="uppercase text-[10px] font-bold">
                  Kurs {targetProfile.class_name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-muted p-2 rounded-full">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">Vollständiger Name</p>
              <p className="text-sm text-muted-foreground mt-1">{targetProfile.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-muted p-2 rounded-full">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">Mitglied-Status</p>
              <p className="text-sm text-muted-foreground mt-1">
                {targetProfile.is_approved ? 'Verifiziertes Mitglied' : 'Wartet auf Freischaltung'}
              </p>
            </div>
          </div>

          {targetProfile.role === 'planner' && (
            <div className="flex items-center gap-4 border-t pt-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Planungsgruppe</p>
                <p className="text-sm text-primary font-bold mt-1">
                  {targetProfile.planning_group || 'Noch keiner Gruppe zugewiesen'}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 border-t pt-4">
            <div className="bg-muted p-2 rounded-full">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">Mitglied seit</p>
              <p className="text-sm text-muted-foreground mt-1">
                {targetProfile.created_at ? format(toDate(targetProfile.created_at), 'PPP', { locale: de }) : 'Unbekannt'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
