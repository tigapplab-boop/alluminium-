'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatMontant, formatDate } from '@/lib/utils'
import type { Devis, StatutDevis } from '@/types'

interface DevisCardProps {
  devis: Devis
}

export function DevisCard({ devis }: DevisCardProps) {
  return (
    <Link href={`/devis/${devis.id}`}>
      <Card className="p-4 hover:border-alu-accent/40 transition-colors duration-150 cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-alu-accent/10 text-alu-accent">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-alu-text text-sm group-hover:text-alu-accent transition-colors truncate">
                {devis.reference}
              </p>
              <p className="text-xs text-alu-sub truncate mt-0.5">
                {devis.client?.nom}{devis.client?.prenom ? ` ${devis.client.prenom}` : ''}
              </p>
            </div>
          </div>
          <Badge variant={devis.statut as StatutDevis} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-alu-sub text-xs">{formatDate(devis.dateDevis)}</span>
          <span className="font-semibold text-alu-text tabular-nums">
            {formatMontant(devis.montantTTC)}
          </span>
        </div>
      </Card>
    </Link>
  )
}