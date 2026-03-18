'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useEffect } from 'react'
import { toDate } from '@/lib/utils'

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Lade Profil...</div>
  }

  if (!user || !profile) {
    return null
  }

  const userInitial = profile.full_name?.substring(0, 1).toUpperCase() || 'U'

  const getRoleLabel = (role: string) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    return role
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mein Konto</h1>
        <p className="text-muted-foreground">
          Verwalte deine persönlichen Informationen und Einstellungen.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b pb-6">
          <Avatar size="lg" className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-1">
              <Badge variant={profile.role.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px]">
                {getRoleLabel(profile.role)}
              </Badge>
              {profile.class_name && (
                <Badge variant="outline" className="uppercase text-[10px] font-bold">
                  Kurs {profile.class_name}
                </Badge>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-muted p-2 rounded-full">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">Vollständiger Name</p>
              <p className="text-sm text-muted-foreground mt-1">{profile.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-muted p-2 rounded-full">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">E-Mail Adresse</p>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-muted p-2 rounded-full">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">Mitglied-Status</p>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.is_approved ? 'Verifiziertes Mitglied' : 'Wartet auf Freischaltung'}
              </p>
            </div>
          </div>

          {profile.role === 'planner' && (
            <div className="flex items-center gap-4 border-t pt-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Planungsgruppe</p>
                <p className="text-sm text-primary font-bold mt-1">
                  {profile.planning_group || 'Noch keiner Gruppe zugewiesen'}
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
                {profile.created_at ? format(toDate(profile.created_at), 'PPP', { locale: de }) : 'Unbekannt'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-muted/30 border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Hilfe & Support</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Wenn du Probleme mit deinem Account hast oder deine Daten ändern möchtest, wende dich bitte an einen Administrator.
        </p>
        <div className="flex gap-4">
          <Badge variant="outline">Admin kontaktieren</Badge>
        </div>
      </div>
    </div>
  )
}
