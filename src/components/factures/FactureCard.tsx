'use client'

import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatMontant, formatDate } from '@/lib/utils'
import type { Facture, StatutFacture } from '@/types'

interface FactureCardProps {
  facture: Facture
}

export function FactureCard({ facture }: FactureCardProps) {
  const payPercent = facture.montantTTC > 0
    ? Math.min((facture.montantPaye / facture.montantTTC) * 100, 100)
    : 0

  const progressColor =
    facture.statut === 'PAYEE'
      ? 'bg-alu-success'
      : facture.statut === 'ANNULEE'
        ? 'bg-alu-danger'
        : 'bg-alu-accent'

  return (
    <Link href={`/factures/${facture.id}`}>
      <Card className="p-4 hover:border-alu-accent/40 transition-colors duration-150 cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-alu-accent/10 text-alu-accent">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-alu-text text-sm group-hover:text-alu-accent transition-colors truncate">
                {facture.reference}
              </p>
              <p className="text-xs text-alu-sub truncate mt-0.5">
                {facture.client?.nom}{facture.client?.prenom ? ` ${facture.client.prenom}` : ''}
              </p>
            </div>
          </div>
          <Badge variant={facture.statut as StatutFacture} />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-alu-sub text-xs">{formatDate(facture.dateFacture)}</span>
          <span className="font-semibold text-alu-text tabular-nums">
            {formatMontant(facture.montantTTC)}
          </span>
        </div>

        {facture.statut !== 'ANNULEE' && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-alu-sub">
              <span>Payé: {formatMontant(facture.montantPaye)}</span>
              <span>{payPercent.toFixed(0)}%</span>
            </div>
            <Progress value={payPercent} colorClass={progressColor} size="sm" />
          </div>
        )}
      </Card>
    </Link>
  )
}