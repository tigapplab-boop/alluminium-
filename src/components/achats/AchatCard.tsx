'use client'

import { useRouter } from 'next/router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatMontant, formatDate } from '@/lib/utils'
import type { Achat, StatutPaiement } from '@/types'
import { ArrowRight, ShoppingBag } from 'lucide-react'

interface AchatCardProps {
  achat: Achat
}

export function AchatCard({ achat }: AchatCardProps) {
  const router = useRouter()

  return (
    <Card
      className="cursor-pointer hover:border-alu-accent/40 transition-colors duration-200 group"
      onClick={() => router.push(`/achats/${achat.id}`)}
      role="link"
      tabIndex={0}
      aria-label={`Voir l'achat ${achat.reference}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/achats/${achat.id}`)
        }
      }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-alu-accent truncate">
                {achat.reference}
              </span>
              <Badge variant={achat.statut as StatutPaiement} />
            </div>
            <p className="text-sm text-alu-text truncate">
              {achat.fournisseur?.nom || 'Fournisseur inconnu'}
            </p>
            <p className="text-xs text-alu-sub mt-1">
              {formatDate(achat.dateAchat)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <p className="text-sm font-bold text-alu-text tabular-nums">
              {formatMontant(achat.montantTotal)}
            </p>
            {achat.resteAPayer > 0 && (
              <p className="text-xs font-medium text-alu-danger tabular-nums">
                Reste: {formatMontant(achat.resteAPayer)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end mt-3 pt-3 border-t border-alu-border/50">
          <span className="inline-flex items-center gap-1 text-xs text-alu-sub group-hover:text-alu-accent transition-colors">
            Voir détails
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function AchatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 rounded bg-alu-border animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-alu-border animate-pulse" />
            </div>
            <div className="h-4 w-40 rounded bg-alu-border animate-pulse" />
            <div className="h-3 w-20 rounded bg-alu-border animate-pulse" />
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="h-4 w-24 rounded bg-alu-border animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AchatsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 rounded-full bg-alu-border/50 p-4">
        <ShoppingBag className="h-8 w-8 text-alu-muted" />
      </div>
      <h3 className="text-base font-semibold text-alu-text">Aucun achat</h3>
      <p className="mt-1.5 max-w-sm text-sm text-alu-sub">
        Vous n&apos;avez pas encore enregistré d&apos;achat. Commencez par créer votre premier achat.
      </p>
    </div>
  )
}