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
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9 border">
          <AvatarFallback className="text-xs bg-primary/5 text-primary">
            {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || member.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate flex items-center gap-1.5">
              {member.full_name || 'Unbekannter Nutzer'}
              {member.is_approved && (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              )}
            </span>
            {isLeader && (
              <Badge variant="secondary" className="h-5 px-1.5 gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                <ShieldCheck className="h-3 w-3" />
                Leiter
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs text-muted-foreground truncate">{member.email}</span>
            {otherGroups.length > 0 && (
              <div className="flex gap-1 shrink-0">
                {otherGroups.map(g => (
                  <Badge key={g} variant="outline" className="text-[8px] px-1 py-0 h-3 font-medium text-muted-foreground/60 border-muted-foreground/20">
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
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
