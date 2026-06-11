'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  Phone,
  MapPin,
  Truck,
  Package,
  ShoppingCart,
  X,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useFournisseur, useUpdateFournisseur } from '@/hooks/useFournisseurs'
import { formatMontant, formatDate } from '@/lib/utils'
import type { Fournisseur, Achat, Produit, StatutPaiement } from '@/types'

/* ── Loading / Error States ──────────────────────── */

function DetailSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader title="Chargement..." />
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Page Component ─────────────────────────────── */

export default function FournisseurDetailPage() {
  const router = useRouter()
  const { id } = router.query as { id: string }
  const [editMode, setEditMode] = useState(false)

  const { data, isLoading, isError, error, refetch } = useFournisseur(id)
  const updateFournisseur = useUpdateFournisseur()

  type FournisseurWithRelations = Fournisseur & {
    achats?: Achat[]
    produits?: Produit[]
  }

  const fournisseur = data?.data as
    | FournisseurWithRelations
    | undefined

  // Edit form state
  const [editNom, setEditNom] = useState('')
  const [editTelephone, setEditTelephone] = useState('')
  const [editAdresse, setEditAdresse] = useState('')
  const [editWilaya, setEditWilaya] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const startEdit = () => {
    if (!fournisseur) return
    setEditNom(fournisseur.nom)
    setEditTelephone(fournisseur.telephone || '')
    setEditAdresse(fournisseur.adresse || '')
    setEditWilaya(fournisseur.wilaya || '')
    setEditNotes(fournisseur.notes || '')
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditMode(false)
  }

  const saveEdit = async () => {
    if (!id) return
    try {
      await updateFournisseur.mutateAsync({
        id,
        payload: {
          nom: editNom,
          telephone: editTelephone || undefined,
          adresse: editAdresse || undefined,
          wilaya: editWilaya || undefined,
          notes: editNotes || undefined,
        },
      })
      setEditMode(false)
    } catch {
      // handled by react-query
    }
  }

  if (!id) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <PageHeader title="Fournisseur" />
        <p className="text-sm text-alu-sub mt-4">ID manquant.</p>
      </main>
    )
  }

  if (isLoading) return <DetailSkeleton />

  if (isError || !fournisseur) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Fournisseur"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/fournisseurs')}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          }
        />
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 p-6 text-center">
          <p className="text-sm text-alu-danger">
            {error?.message || 'Fournisseur introuvable.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            Réessayer
          </Button>
        </div>
      </main>
    )
  }

  const achats = (fournisseur.achats || []).slice(0, 10)
  const produits = fournisseur.produits || []

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title={fournisseur.nom}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/fournisseurs')}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      {/* Info card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-alu-sub" />
            Informations
          </CardTitle>
          {!editMode ? (
            <Button variant="ghost" size="sm" onClick={startEdit}>
              <Edit3 className="h-3.5 w-3.5" />
              Modifier
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                disabled={updateFournisseur.isPending}
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                loading={updateFournisseur.isPending}
              >
                <Check className="h-3.5 w-3.5" />
                Enregistrer
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom *"
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
              />
              <Input
                label="Téléphone"
                value={editTelephone}
                onChange={(e) => setEditTelephone(e.target.value)}
              />
              <Input
                label="Adresse"
                value={editAdresse}
                onChange={(e) => setEditAdresse(e.target.value)}
              />
              <Input
                label="Wilaya"
                value={editWilaya}
                onChange={(e) => setEditWilaya(e.target.value)}
              />
              <div className="sm:col-span-2">
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="flex min-h-[80px] w-full rounded-lg border border-alu-border bg-alu-bg px-3 py-2 text-sm text-alu-text placeholder:text-alu-muted transition-colors duration-150 resize-y focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                  placeholder="Notes..."
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div>
                <span className="text-alu-sub">Nom</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {fournisseur.nom}
                </p>
              </div>
              <div>
                <span className="text-alu-sub flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Téléphone
                </span>
                <p className="font-medium text-alu-text mt-0.5">
                  {fournisseur.telephone || '—'}
                </p>
              </div>
              <div>
                <span className="text-alu-sub flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Adresse
                </span>
                <p className="font-medium text-alu-text mt-0.5">
                  {fournisseur.adresse || '—'}
                </p>
              </div>
              <div>
                <span className="text-alu-sub">Wilaya</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {fournisseur.wilaya || '—'}
                </p>
              </div>
              {fournisseur.notes && (
                <div className="sm:col-span-2">
                  <span className="text-alu-sub">Notes</span>
                  <p className="font-medium text-alu-text mt-0.5 whitespace-pre-wrap">
                    {fournisseur.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 10 derniers achats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-alu-sub" />
            10 derniers achats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achats.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="h-8 w-8 text-alu-muted mx-auto mb-3" />
              <p className="text-sm text-alu-sub">
                Aucun achat pour ce fournisseur.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">
                    Reste
                  </TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achats.map((achat: Achat) => (
                  <TableRow
                    key={achat.id}
                    className="cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/achats/${achat.id}`)
                    }
                  >
                    <TableCell className="font-medium text-alu-accent">
                      {achat.reference}
                    </TableCell>
                    <TableCell className="text-sm text-alu-sub">
                      {formatDate(achat.dateAchat)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMontant(achat.montantTotal)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums">
                      <span
                        className={
                          achat.resteAPayer > 0
                            ? 'text-alu-danger font-medium'
                            : 'text-alu-success'
                        }
                      >
                        {formatMontant(achat.resteAPayer)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={achat.statut as StatutPaiement} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Produits associés */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-alu-sub" />
            Produits associés
            {produits.length > 0 && (
              <span className="text-xs font-normal text-alu-sub">
                ({produits.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {produits.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-8 w-8 text-alu-muted mx-auto mb-3" />
              <p className="text-sm text-alu-sub">
                Aucun produit associé à ce fournisseur.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {produits.map((produit: Produit) => (
                <Link
                  key={produit.id}
                  href={`/produits/${produit.id}`}
                  className="flex items-center justify-between rounded-lg border border-alu-border/50 p-3 hover:bg-alu-border/30 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-alu-text group-hover:text-alu-accent transition-colors truncate">
                      {produit.designation}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-alu-sub">
                      {produit.reference && <span>{produit.reference}</span>}
                      <Badge variant={produit.typeProduit} />
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium tabular-nums text-alu-text">
                      {formatMontant(produit.prixUnitaire)}
                    </p>
                    <p className="text-xs text-alu-sub tabular-nums">
                      Stock: {produit.stockActuel}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
