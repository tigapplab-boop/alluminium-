'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileDown,
  Plus,
  ExternalLink,
  Ban,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PaiementFactureModal } from '@/components/factures/PaiementFactureModal'
import { useFacture, useAnnulerFacture } from '@/hooks/useFactures'
import { formatMontant, formatDate } from '@/lib/utils'
import type { Facture, StatutFacture } from '@/types'

export default function FactureDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data, isLoading, refetch } = useFacture(id)
  const annulerFactureMut = useAnnulerFacture()

  const [facture, setFacture] = useState<Facture | null>(null)
  const [confirmAnnuler, setConfirmAnnuler] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [paiementModal, setPaiementModal] = useState(false)

  useEffect(() => {
    if (data?.data) {
      setFacture(data.data)
    }
  }, [data])

  const handleAnnuler = async () => {
    setActionLoading(true)
    try {
      const result = await annulerFactureMut.mutateAsync(id)
      if (result.data) {
        setFacture(result.data)
      }
    } finally {
      setActionLoading(false)
      setConfirmAnnuler(false)
    }
  }

  const handlePaiementSuccess = () => {
    refetch()
  }

  if (isLoading || !facture) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chargement..." />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const canAnnuler =
    facture?.statut === 'EN_ATTENTE' &&
    (!facture?.paiements || facture.paiements.length === 0)

  const payPercent = facture
    ? facture.montantTTC > 0
      ? Math.min((facture.montantPaye / facture.montantTTC) * 100, 100)
      : 0
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={facture.reference}
        subtitle={`Créée le ${formatDate(facture.createdAt)}`}
        action={
          <Button variant="outline" onClick={() => router.push('/factures')}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      {/* Status + PAYEE stamp */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={facture.statut as StatutFacture} className="text-sm px-3 py-1" />
        {facture.dateEcheance && (
          <span className="text-sm text-alu-sub">
            Échéance: {formatDate(facture.dateEcheance)}
          </span>
        )}
      </div>

      {/* Client info + devis link */}
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {facture.client ? (
            <Link
              href={`/clients/${facture.client.id}`}
              className="text-alu-accent hover:text-alu-accent2 transition-colors font-medium"
            >
              {facture.client.nom}{facture.client.prenom ? ` ${facture.client.prenom}` : ''}
            </Link>
          ) : (
            <span className="text-alu-sub">Client supprimé</span>
          )}
          {facture.client?.telephone && (
            <p className="text-sm text-alu-sub">{facture.client.telephone}</p>
          )}
          {facture.client?.adresse && (
            <p className="text-sm text-alu-sub">
              {facture.client.adresse}{facture.client.wilaya ? ` - ${facture.client.wilaya}` : ''}
            </p>
          )}
          {facture.devis && (
            <Link
              href={`/devis/${facture.devis.id}`}
              className="inline-flex items-center gap-1 text-sm text-alu-accent hover:text-alu-accent2 transition-colors mt-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Voir le devis {facture.devis.reference}
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Lines table */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes de la facture</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">N°</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="w-20">Unité</TableHead>
                <TableHead className="w-20 text-right">Qté</TableHead>
                <TableHead className="w-28 text-right">P.U.</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facture.lignes?.map((ligne, i) => (
                <TableRow key={ligne.id}>
                  <TableCell className="text-alu-sub">{i + 1}</TableCell>
                  <TableCell className="font-medium">{ligne.designation}</TableCell>
                  <TableCell className="hidden md:table-cell text-alu-sub">
                    {ligne.description || '—'}
                  </TableCell>
                  <TableCell>{ligne.unite}</TableCell>
                  <TableCell className="text-right tabular-nums">{ligne.quantite}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMontant(ligne.prixUnitaire)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatMontant(ligne.montantTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals section */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center justify-between w-full sm:w-72 text-sm">
              <span className="text-alu-sub">Montant HT</span>
              <span className="font-medium text-alu-text tabular-nums">{formatMontant(facture.montantHT)}</span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-72 text-sm">
              <span className="text-alu-sub">TVA ({facture.tva}%)</span>
              <span className="font-medium text-alu-text tabular-nums">
                {formatMontant(facture.montantTTC - facture.montantHT)}
              </span>
            </div>
            <Separator className="w-full sm:w-72" />
            <div className="flex items-center justify-between w-full sm:w-72">
              <span className="font-semibold text-alu-text">Montant TTC</span>
              <span className="text-lg font-bold text-alu-accent tabular-nums">{formatMontant(facture.montantTTC)}</span>
            </div>
          </div>

          <Separator />

          {/* Payment summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between w-full sm:w-72 text-sm">
              <span className="text-alu-sub">Montant payé</span>
              <span className="font-medium text-alu-success tabular-nums">{formatMontant(facture.montantPaye)}</span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-72 text-sm">
              <span className="text-alu-sub">Reste à payer</span>
              <span className={`font-medium tabular-nums ${facture.resteAPayer > 0 ? 'text-alu-danger' : 'text-alu-success'}`}>
                {formatMontant(facture.resteAPayer)}
              </span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-72 text-sm">
              <span className="text-alu-sub">Nombre d&apos;articles</span>
              <span className="font-medium text-alu-text tabular-nums">
                {facture.lignes?.length || 0}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {facture.statut !== 'ANNULEE' && (
            <div className="space-y-1.5 w-full sm:w-72">
              <div className="flex items-center justify-between text-xs text-alu-sub">
                <span>Progression du paiement</span>
                <span>{payPercent.toFixed(0)}%</span>
              </div>
              <Progress
                value={payPercent}
                colorClass={
                  facture.statut === 'PAYEE'
                    ? 'bg-alu-success'
                    : 'bg-alu-accent'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paiements section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des paiements</CardTitle>
            {facture.statut !== 'ANNULEE' && facture.statut !== 'PAYEE' && facture.resteAPayer > 0 && (
              <Button size="sm" onClick={() => setPaiementModal(true)}>
                <Plus className="h-4 w-4" />
                Ajouter paiement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!facture.paiements || facture.paiements.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-alu-sub">
              Aucun paiement enregistré
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="hidden sm:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facture.paiements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm tabular-nums">{formatDate(p.datePaiement)}</TableCell>
                    <TableCell className="font-medium text-alu-success tabular-nums">
                      {formatMontant(p.montant)}
                    </TableCell>
                    <TableCell className="capitalize text-sm">{p.modePaiement}</TableCell>
                    <TableCell className="hidden sm:table-cell text-alu-sub text-sm">
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
      {facture.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-alu-sub whitespace-pre-wrap">{facture.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled>
              <FileDown className="h-4 w-4" />
              Exporter PDF
            </Button>

            {facture.devis && (
              <Link href={`/devis/${facture.devis.id}`}>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  Voir le devis
                </Button>
              </Link>
            )}

            {canAnnuler && (
              <Button
                variant="danger"
                onClick={() => setConfirmAnnuler(true)}
                loading={actionLoading}
              >
                <Ban className="h-4 w-4" />
                Annuler la facture
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Annuler confirmation */}
      <ConfirmDialog
        open={confirmAnnuler}
        onClose={() => setConfirmAnnuler(false)}
        onConfirm={handleAnnuler}
        title="Annuler la facture"
        message={`Êtes-vous sûr de vouloir annuler la facture ${facture.reference} ? Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Annuler la facture"
        loading={actionLoading}
      />

      {/* Paiement modal */}
      <PaiementFactureModal
        open={paiementModal}
        onClose={() => setPaiementModal(false)}
        factureId={facture.id}
        resteAPayer={facture.resteAPayer}
        onSuccess={handlePaiementSuccess}
      />
    </div>
  )
}