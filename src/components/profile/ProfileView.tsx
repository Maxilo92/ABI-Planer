'use client'

import { Profile, UserRole } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Shield, Award, MapPin, Users, ShieldCheck, UserPlus, UserX, UserCheck, Settings as SettingsIcon, Calendar, User, Star } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toDate, getOnlineStatus, cn } from '@/lib/utils'
import Link from 'next/link'
import { TeacherAlbum } from '@/components/dashboard/TeacherAlbum'

interface ProfileViewProps {
  profile: Profile
  isOwnProfile?: boolean
  relationshipState?: 'self' | 'none' | 'friends' | 'pending_outgoing' | 'pending_incoming'
  onFriendAction?: (accepted?: boolean) => Promise<void>
  email?: string | null
  emailVerified?: boolean
}

export function ProfileView({ 
  profile, 
  isOwnProfile, 
  relationshipState = 'none', 
  onFriendAction,
  email,
  emailVerified
}: ProfileViewProps) {
  const userInitial = profile.full_name?.substring(0, 1).toUpperCase() || 'U'
  const userCourse = profile.class_name
  const plannerGroup = profile.planning_groups?.join(', ')
  const { isOnline, label: onlineLabel } = getOnlineStatus(profile.isOnline, profile.lastOnline)
  const avatarUrl = profile.photo_url
  const schoolName = profile.school_name || 'Gymnasial-Schule am See'

  const getRoleLabel = (role: UserRole) => {
    if (role === 'admin_main' || role === 'admin') return 'Main Admin'
    if (role === 'admin_co') return 'Co-Admin'
    if (role === 'planner') return 'Planer'
    return 'Zuschauer'
  }

  const canManageFriendship = !isOwnProfile && relationshipState !== 'self'

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto px-4 sm:px-6 pt-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 border-b pb-6">
          <div className="relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-border shadow-sm">
              <AvatarImage src={avatarUrl || ''} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div 
              className={cn(
                "absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-card",
                isOnline ? "bg-emerald-500" : "bg-slate-400"
              )}
              title={onlineLabel}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-2xl sm:text-3xl font-black truncate">
                {profile.full_name}
              </CardTitle>
              {isOwnProfile && (
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2 font-bold" render={<Link href="/einstellungen" />}>
                  <SettingsIcon className="w-4 h-4" /> Einstellungen
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={profile.role.includes('admin') ? 'default' : 'secondary'} className="uppercase text-[10px] font-bold">
                  {getRoleLabel(profile.role)}
                </Badge>
                {userCourse && (
                  <Badge variant="outline" className="uppercase text-[10px] font-bold">
                    Kurs {userCourse}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> {schoolName} • {onlineLabel}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="grid gap-6 py-8">
          {isOwnProfile && (
            <div className="sm:hidden -mt-4 mb-2">
               <Button variant="outline" size="sm" className="w-full gap-2 font-bold" render={<Link href="/einstellungen" />}>
                <SettingsIcon className="w-4 h-4" /> Einstellungen
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-muted p-2.5 rounded-full">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vollständiger Name</p>
                  <p className="text-sm font-semibold text-foreground truncate">{profile.full_name}</p>
                </div>
              </div>

              {(email || profile.email) && (
                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2.5 rounded-full">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-Mail</p>
                    <p className="text-sm font-semibold text-foreground truncate">{email || profile.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="bg-muted p-2.5 rounded-full">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mitglied-Status</p>
                  <p className="text-sm font-semibold text-foreground">
                    {profile.is_approved ? 'Verifiziertes Mitglied' : 'Wartet auf Freischaltung'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-muted p-2.5 rounded-full">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mitglied seit</p>
                  <p className="text-sm font-semibold text-foreground">
                    {profile.created_at ? format(toDate(profile.created_at), 'PPP', { locale: de }) : 'Unbekannt'}
                  </p>
                </div>
              </div>

              {profile.role === 'planner' && (
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Planungsgruppe</p>
                    <p className="text-sm font-black text-primary truncate">
                      {plannerGroup || 'Keine Gruppe'}
                    </p>
                  </div>
                </div>
              )}

              {emailVerified && (
                <div className="flex items-center gap-4">
                   <div className="bg-emerald-500/10 p-2.5 rounded-full text-emerald-600 dark:text-emerald-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Verifizierung</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">E-Mail verifiziert</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!isOwnProfile && onFriendAction && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community & Freunde
            </CardTitle>
            <CardDescription>
              Verwalte deine Verbindung zu {profile.full_name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Status: {relationshipState === 'friends' ? 'Befreundet' : relationshipState === 'pending_outgoing' ? 'Anfrage offen' : relationshipState === 'pending_incoming' ? 'Anfrage erhalten' : 'Kein Kontakt'}
              </p>
              <p>Über Freunde kannst du später Karten tauschen.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={relationshipState === 'friends' ? 'outline' : 'default'} 
                onClick={() => onFriendAction(true)}
                className="gap-2 font-bold"
              >
                {relationshipState === 'friends' ? <UserX className="h-4 w-4" /> : relationshipState === 'pending_incoming' ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {relationshipState === 'friends' ? 'Freundschaft entfernen' : relationshipState === 'pending_outgoing' ? 'Anfrage zurückziehen' : relationshipState === 'pending_incoming' ? 'Anfrage annehmen' : 'Freundschaft anfragen'}
              </Button>
              {relationshipState === 'pending_incoming' && (
                <Button variant="outline" onClick={() => onFriendAction(false)}>
                  Ablehnen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {profile.task_stats && (
          <Card className="border-none shadow-sm bg-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-brand" />
                Engagement & Aufgaben
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aufgaben</p>
                    <p className="text-2xl font-black">{profile.task_stats.completed_count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ersparnis</p>
                    <p className="text-2xl font-black text-emerald-600">{profile.task_stats.total_penalty_reduction || 0}€</p>
                  </div>
                  {(profile.task_stats.ehrenpunkte ?? 0) > 0 && (
                     <div className="space-y-1">
                      <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Ehrenpunkte</p>
                      <p className="text-2xl font-black text-yellow-500 flex items-center gap-2">
                        <Star className="h-5 w-5 fill-current" /> {profile.task_stats.ehrenpunkte}
                      </p>
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>
        )}

        <h4 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" /> Sammelkarten Album
        </h4>
        <TeacherAlbum userId={profile.id} targetProfile={profile} initialLimit={6} />
      </div>
    </div>
  )
}
