'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  Package,
  ShoppingCart,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useProduit, useUpdateProduit } from '@/hooks/useProduits'
import { formatMontant, formatDate, cn } from '@/lib/utils'
import type {
  Produit,
  LigneAchat,
} from '@/types'

/* ── Constants ──────────────────────────────────── */

const typeProduitOptions: { value: string; label: string }[] = [
  { value: 'PROFILE_ALU', label: 'Profil alu' },
  { value: 'VITRAGE', label: 'Vitrage' },
  { value: 'JOINT', label: 'Joint' },
  { value: 'QUINCAILLERIE', label: 'Quincaillerie' },
  { value: 'COLLE_MOUSSE', label: 'Colle mousse' },
  { value: 'MOTEUR_VOLET', label: 'Moteur volet' },
  { value: 'AUTRE', label: 'Autre' },
]

const uniteOptions: { value: string; label: string }[] = [
  { value: 'ML', label: 'ML' },
  { value: 'M2', label: 'M²' },
  { value: 'KG', label: 'KG' },
  { value: 'PIECE', label: 'Pièce' },
  { value: 'BARRE', label: 'Barre' },
  { value: 'ROULEAU', label: 'Rouleau' },
  { value: 'BOITE', label: 'Boîte' },
]

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
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Page Component ──────────────────────────────── */

export default function ProduitDetailPage() {
  const router = useRouter()
  const { id } = router.query as { id: string }
  const [editMode, setEditMode] = useState(false)

  const { data, isLoading, isError, error, refetch } = useProduit(id)
  const updateProduit = useUpdateProduit()

  type ProduitWithLignes = Produit & {
    lignesAchat?: (LigneAchat & {
      achat?: {
        id: string
        reference: string
        dateAchat: string
      }
    })[]
  }

  const produit = data?.data as ProduitWithLignes | undefined

  const isBelowMin = produit ? produit.stockActuel < produit.stockMinimum : false

  // Stock percentage for visual bar (relative to stockMinimum, clamped at 200%)
  const stockPercent = produit
    ? produit.stockMinimum > 0
      ? Math.min(Math.max((produit.stockActuel / produit.stockMinimum) * 100, 0), 200)
      : produit.stockActuel > 0
        ? 100
        : 0
    : 0

  // Edit form state
  const [editDesignation, setEditDesignation] = useState('')
  const [editReference, setEditReference] = useState('')
  const [editTypeProduit, setEditTypeProduit] = useState('')
  const [editUnite, setEditUnite] = useState('')
  const [editPrixUnitaire, setEditPrixUnitaire] = useState('0')
  const [editStockActuel, setEditStockActuel] = useState('0')
  const [editStockMinimum, setEditStockMinimum] = useState('0')
  const [editFournisseurId, setEditFournisseurId] = useState('')

  const startEdit = () => {
    if (!produit) return
    setEditDesignation(produit.designation)
    setEditReference(produit.reference || '')
    setEditTypeProduit(produit.typeProduit)
    setEditUnite(produit.unite)
    setEditPrixUnitaire(String(produit.prixUnitaire))
    setEditStockActuel(String(produit.stockActuel))
    setEditStockMinimum(String(produit.stockMinimum))
    setEditFournisseurId(produit.fournisseurId || '')
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditMode(false)
  }

  const saveEdit = async () => {
    if (!id) return
    try {
      await updateProduit.mutateAsync({
        id,
        payload: {
          designation: editDesignation,
          reference: editReference || undefined,
          typeProduit: editTypeProduit,
          unite: editUnite,
          prixUnitaire: parseFloat(editPrixUnitaire) || 0,
          stockActuel: parseFloat(editStockActuel) || 0,
          stockMinimum: parseFloat(editStockMinimum) || 0,
          fournisseurId: editFournisseurId || undefined,
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
        <PageHeader title="Produit" />
        <p className="text-sm text-alu-sub mt-4">ID manquant.</p>
      </main>
    )
  }

  if (isLoading) return <DetailSkeleton />

  if (isError || !produit) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Produit"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/produits')}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          }
        />
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 p-6 text-center">
          <p className="text-sm text-alu-danger">
            {error?.message || 'Produit introuvable.'}
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

  const lignesAchat = produit.lignesAchat || []

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title={produit.designation}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/produits')}
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
            <Package className="h-4 w-4 text-alu-sub" />
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
                disabled={updateProduit.isPending}
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                loading={updateProduit.isPending}
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
                label="Désignation *"
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
              />
              <Input
                label="Référence"
                value={editReference}
                onChange={(e) => setEditReference(e.target.value)}
              />
              <Select
                label="Type"
                options={typeProduitOptions}
                value={editTypeProduit}
                onChange={(e) => setEditTypeProduit(e.target.value)}
              />
              <Select
                label="Unité"
                options={uniteOptions}
                value={editUnite}
                onChange={(e) => setEditUnite(e.target.value)}
              />
              <Input
                label="Prix unitaire"
                type="number"
                step="0.01"
                value={editPrixUnitaire}
                onChange={(e) => setEditPrixUnitaire(e.target.value)}
              />
              <Input
                label="Fournisseur ID"
                value={editFournisseurId}
                onChange={(e) => setEditFournisseurId(e.target.value)}
                placeholder="ID du fournisseur"
              />
              <Input
                label="Stock actuel"
                type="number"
                step="0.01"
                value={editStockActuel}
                onChange={(e) => setEditStockActuel(e.target.value)}
              />
              <Input
                label="Stock minimum"
                type="number"
                step="0.01"
                value={editStockMinimum}
                onChange={(e) => setEditStockMinimum(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div>
                <span className="text-alu-sub">Désignation</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {produit.designation}
                </p>
              </div>
              <div>
                <span className="text-alu-sub">Référence</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {produit.reference || '—'}
                </p>
              </div>
              <div>
                <span className="text-alu-sub">Type</span>
                <p className="mt-0.5">
                  <Badge variant={produit.typeProduit} />
                </p>
              </div>
              <div>
                <span className="text-alu-sub">Unité</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {produit.unite}
                </p>
              </div>
              <div>
                <span className="text-alu-sub">Prix unitaire</span>
                <p className="font-medium text-alu-text mt-0.5 tabular-nums">
                  {formatMontant(produit.prixUnitaire)}
                </p>
              </div>
              <div>
                <span className="text-alu-sub">Fournisseur</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {produit.fournisseur ? (
                    <Link
                      href={`/fournisseurs/${produit.fournisseur.id}`}
                      className="text-alu-accent hover:underline"
                    >
                      {produit.fournisseur.nom}
                    </Link>
                  ) : (
                    '—'
                  )}
                </p>
              </div>

              {/* Stock section - full width */}
              <div className="sm:col-span-2">
                <span className="text-alu-sub">Stock</span>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        isBelowMin ? 'text-alu-danger' : 'text-alu-text'
                      )}
                    >
                      {produit.stockActuel}
                    </span>
                    <span className="text-xs text-alu-sub">
                      min: {produit.stockMinimum}
                    </span>
                  </div>
                  <Progress
                    value={stockPercent}
                    max={100}
                    colorClass={
                      isBelowMin ? 'bg-alu-danger' : 'bg-alu-accent'
                    }
                    size="md"
                  />
                  {isBelowMin && (
                    <p className="mt-1.5 text-xs text-alu-danger flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Stock en dessous du minimum
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique achats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-alu-sub" />
            Historique achats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lignesAchat.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="h-8 w-8 text-alu-muted mx-auto mb-3" />
              <p className="text-sm text-alu-sub">
                Aucun historique d&apos;achat pour ce produit.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {lignesAchat.map((ligne: LigneAchat & { achat?: { id: string; reference: string; dateAchat: string } }) => (
                <Link
                  key={ligne.id}
                  href={`/achats/${ligne.achatId}`}
                  className="flex items-center justify-between rounded-lg border border-alu-border/50 p-3 hover:bg-alu-border/30 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-alu-text group-hover:text-alu-accent transition-colors">
                      {ligne.achat?.reference || `Achat ${ligne.achatId}`}
                    </p>
                    <p className="text-xs text-alu-sub mt-0.5">
                      {ligne.achat?.dateAchat
                        ? formatDate(ligne.achat.dateAchat)
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium tabular-nums text-alu-text">
                      Qté: {ligne.quantite}
                    </p>
                    <p className="text-xs text-alu-sub tabular-nums">
                      {formatMontant(ligne.prixUnitaire)} / unité
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
