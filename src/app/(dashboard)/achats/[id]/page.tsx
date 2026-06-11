'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import {
  ArrowLeft,
  Plus,
  Building2,
  Calendar,
  FileText,
  Banknote,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useAchat } from '@/hooks/useAchats'
import { PaiementAchatModal } from '@/components/achats/PaiementAchatModal'
import { formatMontant, formatDate } from '@/lib/utils'
import type { StatutPaiement } from '@/types'

export default function AchatDetailPage() {
  const router = useRouter()
  const { id } = router.query as { id: string }
  const [paiementOpen, setPaiementOpen] = useState(false)

  const { data, isLoading, isError, error } = useAchat(id)
  const achat = data?.data

  if (!id) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <PageHeader title="Achat" />
        <p className="text-sm text-alu-sub mt-4">ID manquant.</p>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Chargement..."
          action={
            <Button variant="ghost" size="sm" onClick={() => router.push('/achats')}>
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isError || !achat) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Achat"
          action={
            <Button variant="ghost" size="sm" onClick={() => router.push('/achats')}>
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          }
        />
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 p-6 text-center">
          <p className="text-sm text-alu-danger">
            {error?.message || 'Achat introuvable.'}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/achats')}>
            Retour aux achats
          </Button>
        </div>
      </main>
    )
  }

  const paiementPercent =
    achat.montantTotal > 0
      ? (achat.montantPaye / achat.montantTotal) * 100
      : 0

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title={achat.reference}
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push('/achats')}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      {/* Info section */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-alu-sub" />
              <span className="text-alu-sub">Fournisseur :</span>
              <span className="font-medium text-alu-text">
                {achat.fournisseur?.nom || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-alu-sub" />
              <span className="text-alu-sub">Date :</span>
              <span className="font-medium text-alu-text">
                {formatDate(achat.dateAchat)}
              </span>
            </div>
            <Badge variant={achat.statut as StatutPaiement} />
          </div>
        </CardContent>
      </Card>

      {/* Lines table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-alu-sub" />
            Lignes d&apos;achat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead className="hidden sm:table-cell">Produit</TableHead>
                <TableHead className="text-right">Qté</TableHead>
                <TableHead className="text-right">P.U.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(achat.lignes || []).map((ligne, idx) => (
                <TableRow key={ligne.id}>
                  <TableCell className="text-alu-sub text-xs">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ligne.designation}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-alu-sub text-xs">
                    {ligne.produit?.designation || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {ligne.quantite}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMontant(ligne.prixUnitaire)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatMontant(ligne.montantTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Amounts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-alu-sub">Montant total</p>
            <p className="text-xl font-bold text-alu-text tabular-nums mt-1">
              {formatMontant(achat.montantTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-alu-sub">Montant payé</p>
            <p className="text-xl font-bold text-alu-success tabular-nums mt-1">
              {formatMontant(achat.montantPaye)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-alu-sub">Reste à payer</p>
            <p
              className={`text-xl font-bold tabular-nums mt-1 ${
                achat.resteAPayer > 0 ? 'text-alu-danger' : 'text-alu-success'
              }`}
            >
              {formatMontant(achat.resteAPayer)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment progress */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-alu-sub">Progression du paiement</span>
            <span className="font-medium text-alu-text tabular-nums">
              {paiementPercent.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={achat.montantPaye}
            max={achat.montantTotal}
            colorClass={
              paiementPercent >= 100
                ? 'bg-alu-success'
                : paiementPercent > 0
                ? 'bg-alu-warning'
                : 'bg-alu-danger'
            }
          />
        </CardContent>
      </Card>

      {/* Payments history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-alu-sub" />
            Paiements
          </CardTitle>
          {achat.resteAPayer > 0 && (
            <Button size="sm" onClick={() => setPaiementOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Ajouter paiement
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {(achat.paiements || []).length === 0 ? (
            <div className="py-8 text-center text-sm text-alu-sub">
              Aucun paiement enregistré.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="hidden sm:table-cell">Mode</TableHead>
                  <TableHead className="hidden sm:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achat.paiements!.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      {formatDate(p.datePaiement)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMontant(p.montant)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-alu-sub text-sm capitalize">
                      {p.modePaiement}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-alu-sub text-sm max-w-[200px] truncate">
                      {p.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {achat.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-alu-sub mb-1">Notes</p>
            <p className="text-sm text-alu-text whitespace-pre-wrap">
              {achat.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <PaiementAchatModal
        open={paiementOpen}
        onClose={() => setPaiementOpen(false)}
        achatId={achat.id}
        resteAPayer={achat.resteAPayer}
      />
    </main>
  )
}