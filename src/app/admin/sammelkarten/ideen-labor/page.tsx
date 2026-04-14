'use client'

import React from 'react'
import { useSammelkartenAdmin } from '@/components/admin/SammelkartenAdminContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles } from 'lucide-react'
import { getProposalStatusBadge, getProposalUsageBadge } from '@/lib/utils'

export default function IdeenLaborPage() {
  const {
    cardProposals, proposalsLoading, proposalStatusCounts,
    handleModerateProposal, moderatingProposalId,
    handleBackfillProposalUsage, backfillingProposalUsage
  } = useSammelkartenAdmin()

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ideen-Labor Vorschlaege
            </CardTitle>
            <CardDescription>
              Eingereichte Kartenvorschlaege aus dem Ideen-Labor (Collection: card_proposals).
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Offen: {proposalStatusCounts.pending}</Badge>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Angenommen: {proposalStatusCounts.accepted}</Badge>
            <Badge variant="destructive">Abgelehnt: {proposalStatusCounts.rejected}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBackfillProposalUsage}
              disabled={backfillingProposalUsage}
              className="h-7 text-[11px]"
            >
              {backfillingProposalUsage ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Altfaelle backfill'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {proposalsLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Lade Vorschlaege...</span>
          </div>
        ) : cardProposals.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground italic border rounded-lg bg-muted/20">
            Noch keine Vorschlaege vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {cardProposals.map((proposal) => (
              <Card key={proposal.id} className="border-border/70">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-sm">{proposal.teacher_name}</p>
                      <p className="text-xs text-muted-foreground">
                        von {proposal.created_by_name || 'Unbekannt'} • {new Date(proposal.created_at).toLocaleDateString('de-DE')}
                      </p>
                      {proposal.status !== 'pending' && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Belohnung: {proposal.reward_packs_awarded ?? (proposal.reward_claimed ? 2 : 0)} Booster
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getProposalStatusBadge(proposal.status)}
                      {getProposalUsageBadge(proposal.usage_status)}
                      <Badge variant="outline">HP {proposal.hp}</Badge>
                      {proposal.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => handleModerateProposal(proposal, 'reject')}
                            disabled={moderatingProposalId === proposal.id}
                          >
                            {moderatingProposalId === proposal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ablehnen'}
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => handleModerateProposal(proposal, 'accept')}
                            disabled={moderatingProposalId === proposal.id}
                          >
                            {moderatingProposalId === proposal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Pruefen & annehmen'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {proposal.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {proposal.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(proposal.attacks || []).slice(0, 2).map((attack, idx) => (
                      <div key={`${proposal.id}-attack-${idx}`} className="rounded-md border bg-muted/20 p-2">
                        <p className="text-xs font-bold uppercase tracking-wide">
                          {attack.name || `Angriff ${idx + 1}`}
                          {attack.damage !== undefined ? ` • ${attack.damage} DMG` : ''}
                        </p>
                        {attack.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{attack.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {proposal.admin_note && (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-2">
                      <p className="text-xs font-semibold text-primary">Admin-Notiz</p>
                      <p className="text-xs mt-1 whitespace-pre-wrap">{proposal.admin_note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
