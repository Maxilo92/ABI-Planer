'use client'

import { Profile } from '@/types/database'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, ShieldCheck, UserMinus, UserPlus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MemberItemProps {
  member: Profile
  isLeader?: boolean
  showActions?: boolean
  onMakeLeader?: (id: string) => void
  onRemove?: (id: string) => void
  currentGroupName?: string
}

export function MemberItem({ 
  member, 
  isLeader, 
  showActions, 
  onMakeLeader, 
  onRemove,
  currentGroupName
}: MemberItemProps) {
  const otherGroups = member.planning_groups?.filter(g => g !== currentGroupName) || []

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-primary/5 transition-all duration-300 group">
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="h-10 w-10 border-primary/10 shadow-sm">
          <AvatarFallback className="text-[10px] font-black bg-primary/5 text-primary uppercase tracking-widest">
            {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || member.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold truncate flex items-center gap-2 tracking-tight text-foreground/90">
              {member.full_name || 'Unbekannter Nutzer'}
              {member.is_approved && (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              )}
            </span>
            {isLeader && (
              <Badge variant="secondary" className="h-5 px-2 gap-1 text-[9px] font-black uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 rounded-full">
                <ShieldCheck className="h-2.5 w-2.5" />
                Leiter
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[11px] font-medium text-muted-foreground/60 truncate tracking-tight">{member.email}</span>
            {otherGroups.length > 0 && (
              <div className="flex gap-1 shrink-0">
                {otherGroups.map(g => (
                  <Badge key={g} variant="outline" className="text-[8px] px-1.5 py-0 h-3.5 font-bold uppercase tracking-tighter text-muted-foreground/40 border-muted-foreground/10 rounded-sm">
                    {g}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10 hover:text-primary rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Aktionen</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            {!isLeader && onMakeLeader && (
              <DropdownMenuItem onClick={() => onMakeLeader(member.id)}>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Zum Leiter machen</span>
              </DropdownMenuItem>
            )}
            {onRemove && (
              <DropdownMenuItem 
                onClick={() => onRemove(member.id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <UserMinus className="mr-2 h-4 w-4" />
                <span>Aus Gruppe entfernen</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
