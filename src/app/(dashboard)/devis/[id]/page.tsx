'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  FileDown,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDevisById, useUpdateStatutDevis, useConvertirDevis } from '@/hooks/useDevis'
import { formatMontant, formatDate } from '@/lib/utils'
import type { Devis, StatutDevis } from '@/types'
import api from '@/lib/api'

export default function DevisDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data, isLoading, refetch } = useDevisById(id)
  const updateStatutMut = useUpdateStatutDevis()
  const convertirMut = useConvertirDevis()

  const [devis, setDevis] = useState<Devis | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (data?.data && !loadedRef.current) {
      loadedRef.current = true
      setDevis(data.data)
    }
  }, [data])

  useEffect(() => {
    if (data?.data) {
      setDevis(data.data)
    }
  }, [data])

  const reloadDevis = async () => {
    await refetch()
  }

  const handleStatutChange = async (statut: StatutDevis) => {
    setActionLoading(true)
    try {
      const result = await updateStatutMut.mutateAsync({ id, statut })
      if (result.data) {
        setDevis(result.data)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await api.delete(`/devis/${id}`)
      setActionLoading(false)
      setConfirmDelete(false)
      router.push('/devis')
    } catch {
      setActionLoading(false)
    }
  }

  const handleConvertir = async () => {
    setActionLoading(true)
    try {
      const result = await convertirMut.mutateAsync(id)
      if (result.data) {
        const facture = result.data as { id: string }
        router.push(`/factures/${facture.id}`)
      } else {
        reloadDevis()
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading || !devis) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chargement..." />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const isActionDisabled = actionLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={devis.reference}
        subtitle={`Créé le ${formatDate(devis.createdAt)}`}
        action={
          <Button variant="outline" onClick={() => router.push('/devis')}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      {/* Status badge prominently */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={devis.statut as StatutDevis} className="text-sm px-3 py-1" />
        {devis.dateValidite && (
          <span className="text-sm text-alu-sub">
            Valide jusqu&apos;au {formatDate(devis.dateValidite)}
          </span>
        )}
      </div>

      {/* Client info */}
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent>
          {devis.client ? (
            <Link
              href={`/clients/${devis.client.id}`}
              className="text-alu-accent hover:text-alu-accent2 transition-colors font-medium"
            >
              {devis.client.nom}{devis.client.prenom ? ` ${devis.client.prenom}` : ''}
            </Link>
          ) : (
            <span className="text-alu-sub">Client supprimé</span>
          )}
          {devis.client?.telephone && (
            <p className="text-sm text-alu-sub mt-1">{devis.client.telephone}</p>
          )}
          {devis.client?.adresse && (
            <p className="text-sm text-alu-sub">{devis.client.adresse}{devis.client.wilaya ? ` - ${devis.client.wilaya}` : ''}</p>
          )}
        </CardContent>
      </Card>

      {/* Lines table */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes du devis</CardTitle>
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
              {devis.lignes?.map((ligne, i) => (
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

      {/* Totals */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center justify-between w-full sm:w-72 text-sm">
              <span className="text-alu-sub">Montant HT</span>
              <span className="font-medium text-alu-text tabular-nums">{formatMontant(devis.montantHT)}</span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-72 text-sm">
              <span className="text-alu-sub">TVA ({devis.tva}%)</span>
              <span className="font-medium text-alu-text tabular-nums">
                {formatMontant(devis.montantTTC - devis.montantHT)}
              </span>
            </div>
            <Separator className="w-full sm:w-72" />
            <div className="flex items-center justify-between w-full sm:w-72">
              <span className="font-semibold text-alu-text">Montant TTC</span>
              <span className="text-lg font-bold text-alu-accent tabular-nums">{formatMontant(devis.montantTTC)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {devis.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-alu-sub whitespace-pre-wrap">{devis.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons based on status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            {/* Export PDF - always visible */}
            <Button variant="outline" disabled>
              <FileDown className="h-4 w-4" />
              Exporter PDF
            </Button>

            {/* BROUILLON actions */}
            {devis.statut === 'BROUILLON' && (
              <>
                <Button
                  onClick={() => handleStatutChange('ENVOYE')}
                  loading={actionLoading}
                >
                  <Send className="h-4 w-4" />
                  Marquer envoyé
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/devis/${devis.id}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isActionDisabled}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </>
            )}

            {/* ENVOYE actions */}
            {devis.statut === 'ENVOYE' && (
              <>
                <Button
                  onClick={() => handleStatutChange('ACCEPTE')}
                  loading={actionLoading}
                >
                  <CheckCircle className="h-4 w-4" />
                  Accepter
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatutChange('REFUSE')}
                  loading={actionLoading}
                >
                  <XCircle className="h-4 w-4" />
                  Refuser
                </Button>
              </>
            )}

            {/* ACCEPTE - convert to facture */}
            {devis.statut === 'ACCEPTE' && (
              <Button
                onClick={handleConvertir}
                loading={actionLoading}
                className="bg-alu-accent text-white hover:bg-alu-accent2"
              >
                <RefreshCw className="h-4 w-4" />
                Convertir en facture
              </Button>
            )}

            {/* CONVERTI - link to facture */}
            {devis.statut === 'CONVERTI' && devis.factures && devis.factures.length > 0 && (
              <Link href={`/factures/${devis.factures[0].id}`}>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  Voir la facture
                </Button>
              </Link>
            )}

            {/* REFUSE - no actions */}
            {devis.statut === 'REFUSE' && (
              <p className="text-sm text-alu-sub">Aucune action disponible pour un devis refusé.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Supprimer le devis"
        message={`Êtes-vous sûr de vouloir supprimer le devis ${devis.reference} ? Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Supprimer"
        loading={actionLoading}
      />
    </div>
  )
}