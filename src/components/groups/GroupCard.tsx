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
    <CardHeader className={cn("border-b pb-4", className)}>
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-bold tracking-tight">
          {name}
        </CardTitle>
        {actions}
      </div>
      {memberCount !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-1">
          <Users className="h-3.5 w-3.5" />
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
    <CardContent className={cn("flex-1 pt-4 pb-2", className)}>
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
    <CardFooter className={cn("pt-2 pb-4 px-4 bg-muted/30 border-t", className)}>
      <div className="flex items-center gap-2 w-full">
        {children}
      </div>
    </CardFooter>
  )
}

interface GroupCardComponent extends React.FC<GroupCardProps> {
  Header: typeof GroupCardHeader
  MemberList: typeof GroupCardMemberList
  Actions: typeof GroupCardActions
}

export const GroupCard: GroupCardComponent = ({ 
  children, 
  className, 
  size = "default" 
}: GroupCardProps) => {
  return (
    <Card className={cn("flex flex-col h-full", className)} size={size}>
      {children}
    </Card>
  )
}

// Assign sub-components to GroupCard
GroupCard.Header = GroupCardHeader
GroupCard.MemberList = GroupCardMemberList
GroupCard.Actions = GroupCardActions
