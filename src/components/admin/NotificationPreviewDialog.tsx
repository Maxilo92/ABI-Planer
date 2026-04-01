
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RemovedCard {
  teacherId: string;
  teacherName: string;
  rarity: string;
  variants: Record<string, number>;
  totalRemoved: number;
  duplicates: number;
  compensationPacks: number;
}

interface UserNotificationData {
  userId: string;
  userName?: string;
  totalCardsRemoved: number;
  totalCompensation: number;
  removedCards: RemovedCard[];
}

interface NotificationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: UserNotificationData[];
  isLoading?: boolean;
  onConfirm?: (selectedUserIds: string[]) => void;
  actionType?: 'remove_teacher' | 'validate_rarities';
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-300',
  rare: 'bg-blue-400',
  epic: 'bg-purple-400',
  mythic: 'bg-cyan-500',
  legendary: 'bg-yellow-400',
  iconic: 'bg-red-500',
};

const rarityLabels: Record<string, string> = {
  common: 'Häufig',
  rare: 'Selten',
  epic: 'Episch',
  mythic: 'Mythisch',
  legendary: 'Legendär',
  iconic: 'Ikonisch',
};

export function NotificationPreviewDialog({
  open,
  onOpenChange,
  notifications,
  isLoading = false,
  onConfirm,
  actionType = 'validate_rarities',
}: NotificationPreviewDialogProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setExpandedUsers(new Set())
    setSelectedUsers(new Set(notifications.map((entry) => entry.userId)))
  }, [open, notifications])

  const stats = useMemo(() => {
    const visible = notifications.filter((entry) => selectedUsers.has(entry.userId))
    return {
      totalUsers: visible.length,
      totalCardsRemoved: visible.reduce((sum, n) => sum + n.totalCardsRemoved, 0),
      totalCompensation: visible.reduce((sum, n) => sum + n.totalCompensation, 0),
    }
  }, [notifications, selectedUsers])

  const toggleExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleSelected = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const allSelected = notifications.length > 0 && selectedUsers.size === notifications.length
  const isCompact = notifications.length <= 3
  const totalRows = notifications.reduce((sum, entry) => sum + entry.removedCards.length, 0)

  const toggleAll = () => {
    if (allSelected) {
      setSelectedUsers(new Set())
      return
    }
    setSelectedUsers(new Set(notifications.map((entry) => entry.userId)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[98vw] sm:w-[95vw] lg:w-[1200px] max-w-[1200px] flex flex-col p-3 sm:p-5 border-border/70',
          isCompact && totalRows <= 6 ? 'max-h-[78vh]' : 'h-[90vh] max-h-[90vh]'
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-wide">
            Mismatch-Änderungen prüfen
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs sm:text-sm">
            Nutzer sind standardmäßig eingeklappt. Wähle nur die Schüler aus, die wirklich angepasst werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className={cn('flex-1 overflow-y-auto space-y-3 pr-1', isCompact ? '' : 'sm:pr-2')}>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 border-b z-10">
            <Card className="bg-muted/30">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ausgewählte Nutzer</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-xl sm:text-2xl font-black">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Entfernte Karten</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-xl sm:text-2xl font-black text-red-600">-{stats.totalCardsRemoved}</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Booster-Kompensation</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-xl sm:text-2xl font-black text-emerald-600">+{stats.totalCompensation}</div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Auswahl</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={toggleAll}>
                  {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* User Notifications */}
          <div className={cn('space-y-2', isCompact ? 'pb-1' : 'pb-2')}>
            {notifications.map((notification, idx) => (
              <Card
                key={idx}
                className={cn(
                  'overflow-hidden transition-all border-border/70',
                  selectedUsers.has(notification.userId)
                    ? 'bg-card'
                    : 'opacity-60 bg-muted/20'
                )}
              >
                <CardHeader className="py-2.5 px-3 sm:px-4 bg-muted/20 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(notification.userId)}
                      onChange={() => toggleSelected(notification.userId)}
                      className="h-4 w-4"
                    />
                    <button
                      type="button"
                      className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left rounded-md"
                      onClick={() => toggleExpanded(notification.userId)}
                    >
                      <div className="flex items-start gap-2 min-w-0 w-full sm:w-auto">
                        {expandedUsers.has(notification.userId) ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        )}
                        <CardTitle className="text-sm leading-snug break-all whitespace-normal">
                          {notification.userName ? `${notification.userName} (${notification.userId})` : notification.userId}
                        </CardTitle>
                      </div>
                      <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                        <span className="text-sm font-black text-red-600">-{notification.totalCardsRemoved}</span>
                        <span className="text-sm font-black text-emerald-600">+{notification.totalCompensation}</span>
                      </div>
                    </button>
                  </div>
                </CardHeader>

                {expandedUsers.has(notification.userId) && (
                  <CardContent className="pt-2 px-3 sm:px-4">
                    <div className="space-y-1.5">
                      {notification.removedCards.map((card, cardIdx) => {
                        const variantEntries = Object.entries(card.variants || {})
                        const variantSummary = variantEntries.map(([variant, count]) => `${count}x ${variant}`).join(', ')

                        return (
                          <div key={cardIdx} className="flex items-start justify-between p-2 bg-muted/20 rounded-md border border-border/60 gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{card.teacherName}</div>
                              <div className="text-xs text-muted-foreground mt-1">{variantSummary || 'keine Varianten'}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Entfernt: {card.totalRemoved} Karten
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <Badge className={`${rarityColors[card.rarity?.toLowerCase()] || 'bg-gray-400'} text-white text-xs`}>
                                {rarityLabels[card.rarity?.toLowerCase()] || card.rarity}
                              </Badge>
                              <span className="text-sm font-semibold text-gray-700 w-10 text-right">-{card.totalRemoved}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            Abbrechen
          </Button>
          <Button
            disabled={isLoading || selectedUsers.size === 0}
            onClick={() => onConfirm?.(Array.from(selectedUsers))}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird ausgeführt...
              </>
            ) : (
              `Jetzt ausführen (${selectedUsers.size})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
