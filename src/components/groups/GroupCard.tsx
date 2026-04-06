'use client'

import * as React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GroupCardProps {
  children: React.ReactNode
  className?: string
  size?: "default" | "sm"
}

interface GroupCardHeaderProps {
  name: string
  memberCount?: number
  className?: string
  actions?: React.ReactNode
}

function GroupCardHeader({ 
  name, 
  memberCount, 
  className,
  actions 
}: GroupCardHeaderProps) {
  return (
    <CardHeader className={cn("pb-4", className)}>
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-black uppercase tracking-widest">
          {name}
        </CardTitle>
        {actions}
      </div>
      {memberCount !== undefined && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">
          <Users className="h-3 w-3" />
          <span>{memberCount} {memberCount === 1 ? 'Mitglied' : 'Mitglieder'}</span>
        </div>
      )}
    </CardHeader>
  )
}

interface GroupCardMemberListProps {
  children: React.ReactNode
  className?: string
  emptyState?: React.ReactNode
}

function GroupCardMemberList({ 
  children, 
  className,
  emptyState 
}: GroupCardMemberListProps) {
  const childrenCount = React.Children.count(children)

  return (
    <CardContent className={cn("flex-1 pt-2 pb-2", className)}>
      {childrenCount === 0 && emptyState ? (
        emptyState
      ) : (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </CardContent>
  )
}

interface GroupCardActionsProps {
  children: React.ReactNode
  className?: string
}

function GroupCardActions({ children, className }: GroupCardActionsProps) {
  return (
    <CardFooter className={cn("pt-2 pb-6 px-6 bg-primary/5", className)}>
      <div className="flex items-center gap-2 w-full">
        {children}
      </div>
    </CardFooter>
  )
}

interface GroupCardJoinButtonProps {
  onClick: () => void
  isLoading?: boolean
  isDisabled?: boolean
  className?: string
}

import { Button } from '@/components/ui/button'
import { UserPlus, Loader2 } from 'lucide-react'

function GroupCardJoinButton({ 
  onClick, 
  isLoading, 
  isDisabled,
  className 
}: GroupCardJoinButtonProps) {
  return (
    <Button 
      variant="default" 
      size="sm" 
      className={cn("w-full h-11 text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 gap-2.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]", className)}
      onClick={onClick}
      disabled={isLoading || isDisabled}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      <span>{isLoading ? 'Beitritt...' : 'Team beitreten'}</span>
    </Button>
  )
}

interface GroupCardComponent extends React.FC<GroupCardProps> {
  Header: typeof GroupCardHeader
  MemberList: typeof GroupCardMemberList
  Actions: typeof GroupCardActions
  JoinButton: typeof GroupCardJoinButton
}

export const GroupCard: GroupCardComponent = ({ 
  children, 
  className, 
  size = "default" 
}: GroupCardProps) => {
  return (
    <Card className={cn("flex flex-col h-full rounded-[2.5rem] border-primary/10 shadow-2xl shadow-primary/5 bg-background/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/10 group/card overflow-hidden", className)} size={size}>
      {children}
    </Card>
  )
}

// Assign sub-components to GroupCard
GroupCard.Header = GroupCardHeader
GroupCard.MemberList = GroupCardMemberList
GroupCard.Actions = GroupCardActions
GroupCard.JoinButton = GroupCardJoinButton
