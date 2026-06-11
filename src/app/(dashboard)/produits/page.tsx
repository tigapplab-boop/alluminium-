'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Package,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useProduits,
  useCreateProduit,
  useProduitAlertes,
} from '@/hooks/useProduits'
import { useFournisseurs } from '@/hooks/useFournisseurs'
import { formatMontant, cn } from '@/lib/utils'
import type { Produit } from '@/types'

/* ── Constants ──────────────────────────────────── */

const typeProduitOptions: { value: string; label: string }[] = [
  { value: '', label: 'Tous les types' },
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

/* ── Form Schema ─────────────────────────────────── */

const produitSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  reference: z.string().optional(),
  typeProduit: z.string().min(1, 'Le type est requis'),
  unite: z.string().optional(),
  prixUnitaire: z.number().min(0, 'Le prix doit être positif'),
  stockActuel: z.number().min(0),
  stockMinimum: z.number().min(0),
  fournisseurId: z.string().optional(),
})

type ProduitFormData = z.infer<typeof produitSchema>

/* ── Produit Card ───────────────────────────────── */

function ProduitCard({
  produit,
  onClick,
}: {
  produit: Produit
  onClick: () => void
}) {
  const isBelowMin = produit.stockActuel < produit.stockMinimum

  return (
    <Card
      className={cn(
        'cursor-pointer hover:border-alu-accent/40 transition-colors duration-200 group',
        isBelowMin && 'border-alu-danger/30'
      )}
      onClick={onClick}
      role="link"
      tabIndex={0}
      aria-label={`Voir le produit ${produit.designation}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-alu-text truncate">
              {produit.designation}
            </p>
            {produit.reference && (
              <p className="text-xs text-alu-sub mt-0.5">
                Réf: {produit.reference}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge variant={produit.typeProduit} />
              <span className="text-xs text-alu-muted">{produit.unite}</span>
            </div>
          </div>
          {isBelowMin && (
            <AlertTriangle className="h-4 w-4 text-alu-danger shrink-0 mt-0.5" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-alu-border/50 text-xs">
          <div>
            <span className="text-alu-sub">Prix unit.</span>
            <p className="font-medium text-alu-text tabular-nums mt-0.5">
              {formatMontant(produit.prixUnitaire)}
            </p>
          </div>
          <div>
            <span className="text-alu-sub">Stock</span>
            <p
              className={cn(
                'font-medium tabular-nums mt-0.5',
                isBelowMin ? 'text-alu-danger' : 'text-alu-text'
              )}
            >
              {produit.stockActuel}
            </p>
          </div>
          <div>
            <span className="text-alu-sub">Stock min.</span>
            <p className="font-medium text-alu-text tabular-nums mt-0.5">
              {produit.stockMinimum}
            </p>
          </div>
        </div>

        {produit.fournisseur && (
          <p className="text-xs text-alu-muted mt-2">
            Fournisseur: {produit.fournisseur.nom}
          </p>
        )}

        <div className="flex items-center justify-end mt-3 pt-3 border-t border-alu-border/50">
          <span className="inline-flex items-center gap-1 text-xs text-alu-sub group-hover:text-alu-accent transition-colors">
            Voir détails
            <Plus className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ProduitCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-alu-border animate-pulse" />
          <div className="h-3 w-24 rounded bg-alu-border animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-alu-border/50">
          <div className="h-3 w-16 rounded bg-alu-border animate-pulse" />
          <div className="h-3 w-12 rounded bg-alu-border animate-pulse" />
          <div className="h-3 w-12 rounded bg-alu-border animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Page Component ──────────────────────────────── */

export default function ProduitsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeProduit, setTypeProduit] = useState('')
  const [alertesOnly, setAlertesOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // Fetch alertes if toggled
  const alertesQuery = useProduitAlertes()
  const alertes = alertesQuery.data?.data || []

  // Fetch all products
  const produitsQuery = useProduits({
    search: search || undefined,
    typeProduit: typeProduit || undefined,
    alerte: alertesOnly,
  })

  const allProduits = (produitsQuery.data?.data as Produit[] | undefined) || []

  // When alertesOnly, use alertes data; otherwise use regular query
  const produits = alertesOnly
    ? alertes.filter((p) => {
        if (typeProduit && p.typeProduit !== typeProduit) return false
        if (search) {
          const s = search.toLowerCase()
          return (
            p.designation.toLowerCase().includes(s) ||
            (p.reference && p.reference.toLowerCase().includes(s))
          )
        }
        return true
      })
    : allProduits

  const isLoading = alertesOnly ? alertesQuery.isLoading : produitsQuery.isLoading
  const isError = alertesOnly ? alertesQuery.isError : produitsQuery.isError
  const error = alertesOnly ? alertesQuery.error : produitsQuery.error
  const refetch = alertesOnly
    ? alertesQuery.refetch
    : produitsQuery.refetch

  // Fetch fournisseurs for the create dialog select
  const { data: fournisseursData } = useFournisseurs()
  const fournisseurs =
    (fournisseursData?.data as { id: string; nom: string }[] | undefined) || []
  const fournisseurOptions = [
    { value: '', label: 'Aucun fournisseur' },
    ...fournisseurs.map((f) => ({ value: f.id, label: f.nom })),
  ]

  const createProduit = useCreateProduit()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProduitFormData>({
    resolver: zodResolver(produitSchema),
    defaultValues: {
      designation: '',
      reference: '',
      typeProduit: '',
      unite: 'PIECE',
      prixUnitaire: 0,
      stockActuel: 0,
      stockMinimum: 0,
      fournisseurId: '',
    },
  })

  const onCreateSubmit = async (formData: ProduitFormData) => {
    try {
      await createProduit.mutateAsync({
        ...formData,
        prixUnitaire: Number(formData.prixUnitaire) || 0,
        stockActuel: Number(formData.stockActuel) || 0,
        stockMinimum: Number(formData.stockMinimum) || 0,
        fournisseurId: formData.fournisseurId || undefined,
      })
      reset()
      setCreateOpen(false)
    } catch {
      // Error handled by react-query
    }
  }

  const handleTypeChange = (val: string) => {
    setTypeProduit(val)
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Produits"
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par désignation ou référence..."
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={typeProduitOptions}
            value={typeProduit}
            onChange={(e) => handleTypeChange(e.target.value)}
            placeholder="Type de produit"
          />
        </div>
        <Button
          variant={alertesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAlertesOnly(!alertesOnly)}
          className={cn('shrink-0', alertesOnly && 'bg-alu-danger hover:bg-red-500')}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {alertesOnly ? 'Alertes actives' : 'Alertes seulement'}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProduitCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 p-6 text-center">
          <p className="text-sm text-alu-danger">
            {error?.message || 'Une erreur est survenue.'}
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
      ) : produits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 rounded-full bg-alu-border/50 p-4">
            <Package className="h-8 w-8 text-alu-muted" />
          </div>
          <h3 className="text-base font-semibold text-alu-text">
            {search || typeProduit || alertesOnly
              ? 'Aucun résultat'
              : 'Aucun produit'}
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-alu-sub">
            {search || typeProduit || alertesOnly
              ? 'Aucun produit ne correspond à vos filtres.'
              : "Vous n'avez pas encore enregistré de produit. Commencez par créer votre premier produit."}
          </p>
          {!search && !typeProduit && !alertesOnly && (
            <Button
              size="sm"
              className="mt-6"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nouveau produit
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((produit) => (
            <ProduitCard
              key={produit.id}
              produit={produit}
              onClick={() => router.push(`/produits/${produit.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create produit dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Nouveau produit</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau produit.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="create-produit-form"
            onSubmit={handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <Input
              label="Désignation *"
              placeholder="Nom du produit"
              {...register('designation')}
              error={errors.designation?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Référence"
                placeholder="Réf. interne"
                {...register('reference')}
              />
              <Select
                label="Type *"
                options={typeProduitOptions.filter((o) => o.value !== '')}
                placeholder="Type de produit"
                {...register('typeProduit')}
                error={errors.typeProduit?.message}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Unité"
                options={uniteOptions}
                {...register('unite')}
              />
              <Select
                label="Fournisseur"
                options={fournisseurOptions}
                {...register('fournisseurId')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Prix unitaire"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('prixUnitaire', { valueAsNumber: true })}
              />
              <Input
                label="Stock actuel"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('stockActuel', { valueAsNumber: true })}
              />
              <Input
                label="Stock minimum"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('stockMinimum', { valueAsNumber: true })}
              />
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setCreateOpen(false)}
            disabled={createProduit.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="create-produit-form"
            loading={createProduit.isPending}
          >
            Créer le produit
          </Button>
        </DialogFooter>
      </Dialog>
    </main>
  )
}
