'use client'

import Link from 'next/link'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  Receipt,
  ShoppingCart,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useDashboard, useMensuel } from '@/hooks/useComptabilite'
import { useProduitAlertes } from '@/hooks/useProduits'
import { useFactures } from '@/hooks/useFactures'
import { useAchats } from '@/hooks/useAchats'
import { formatMontant } from '@/lib/utils'
import type { Facture, Achat, Produit } from '@/types'

/* ── KPI Section ──────────────────────────────────── */

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function KPISection() {
  const dashboard = useDashboard()
  const mensuel = useMensuel()

  const isLoading = dashboard.isLoading || mensuel.isLoading

  // Get current month data from mensuel (last entry)
  const currentMonth = mensuel.data?.data?.[mensuel.data.data.length - 1]
  const currentMonthRecettes = currentMonth?.recettes || 0
  const currentMonthAchats = currentMonth?.achats || 0
  const currentMonthBenefice = currentMonthRecettes - currentMonthAchats

  const soldeCaisse = dashboard.data?.data?.soldeCaisse ?? 0

  if (isLoading) return <KPISkeleton />

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Solde caisse"
        value={formatMontant(soldeCaisse)}
        icon={<Wallet className="h-5 w-5" />}
        colorClass="text-alu-accent"
      />
      <StatCard
        title="Recettes (mois)"
        value={formatMontant(currentMonthRecettes)}
        icon={<ArrowUpRight className="h-5 w-5" />}
        colorClass="text-alu-success"
      />
      <StatCard
        title="Achats (mois)"
        value={formatMontant(currentMonthAchats)}
        icon={<ArrowDownRight className="h-5 w-5" />}
        colorClass="text-alu-danger"
      />
      <StatCard
        title="Bénéfice du mois"
        value={formatMontant(currentMonthBenefice)}
        icon={<TrendingUp className="h-5 w-5" />}
        colorClass={
          currentMonthBenefice >= 0 ? 'text-alu-success' : 'text-alu-danger'
        }
      />
    </div>
  )
}

/* ── Stock Alerts Section ────────────────────────── */

function StockAlertsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function StockAlertsSection() {
  const { data, isLoading, isError, error, refetch } = useProduitAlertes()
  const alertes = data?.data || []

  if (isLoading) return <StockAlertsSkeleton />

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-alu-danger" />
            Alertes Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-alu-danger">{error?.message || 'Erreur de chargement.'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (alertes.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-alu-danger" />
          Alertes Stock
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-alu-danger/10 text-alu-danger text-xs font-semibold px-1.5">
            {alertes.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alertes.map((produit: Produit) => (
            <Link
              key={produit.id}
              href={`/produits/${produit.id}`}
              className="flex items-center justify-between rounded-lg border border-alu-border/50 p-3 hover:bg-alu-border/30 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-alu-text truncate group-hover:text-alu-accent transition-colors">
                  {produit.designation}
                </p>
                <p className="text-xs text-alu-sub mt-0.5">
                  Stock : {produit.stockActuel} / min {produit.stockMinimum}
                </p>
              </div>
              <Badge variant={produit.typeProduit} />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Impayés Section ─────────────────────────────── */

function ImpayesFacturesList() {
  const { data, isLoading, isError, error } = useFactures({
    page: 1,
    limit: 10,
  })

  const allFactures = data?.data || []
  const impayesFactures = allFactures.filter(
    (f: Facture) =>
      f.statut !== 'PAYEE' &&
      f.statut !== 'ANNULEE' &&
      f.resteAPayer > 0
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-alu-danger">{error?.message || 'Erreur'}</p>
    )
  }

  if (impayesFactures.length === 0) {
    return (
      <p className="text-sm text-alu-sub py-4 text-center">
        Aucune facture impayée
      </p>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {impayesFactures.map((facture: Facture) => (
        <Link
          key={facture.id}
          href={`/factures/${facture.id}`}
          className="flex items-center justify-between rounded-lg border border-alu-border/50 p-3 hover:bg-alu-border/30 transition-colors group"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-alu-text group-hover:text-alu-accent transition-colors truncate">
              {facture.reference}
            </p>
            <p className="text-xs text-alu-sub mt-0.5 truncate">
              {facture.client?.nom} {facture.client?.prenom || ''}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm font-medium tabular-nums text-alu-text">
              {formatMontant(facture.montantTTC)}
            </p>
            <p className="text-xs font-semibold tabular-nums text-alu-danger">
              Reste: {formatMontant(facture.resteAPayer)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ImpayesAchatsList() {
  const { data, isLoading, isError, error } = useAchats({
    page: 1,
    limit: 10,
  })

  const allAchats = data?.data || []
  const impayesAchats = allAchats.filter(
    (a: Achat) => a.statut !== 'PAYE' && a.resteAPayer > 0
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-alu-danger">{error?.message || 'Erreur'}</p>
    )
  }

  if (impayesAchats.length === 0) {
    return (
      <p className="text-sm text-alu-sub py-4 text-center">
        Aucun achat impayé
      </p>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {impayesAchats.map((achat: Achat) => (
        <Link
          key={achat.id}
          href={`/achats/${achat.id}`}
          className="flex items-center justify-between rounded-lg border border-alu-border/50 p-3 hover:bg-alu-border/30 transition-colors group"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-alu-text group-hover:text-alu-accent transition-colors truncate">
              {achat.reference}
            </p>
            <p className="text-xs text-alu-sub mt-0.5 truncate">
              {achat.fournisseur?.nom || '—'}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm font-medium tabular-nums text-alu-text">
              {formatMontant(achat.montantTotal)}
            </p>
            <p className="text-xs font-semibold tabular-nums text-alu-danger">
              Reste: {formatMontant(achat.resteAPayer)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ImpayesSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Factures impayées */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-alu-sub" />
            Factures impayées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImpayesFacturesList />
        </CardContent>
      </Card>

      {/* Achats impayés */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4 text-alu-sub" />
            Achats impayés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImpayesAchatsList />
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Dashboard Page ───────────────────────────────── */

export default function DashboardPage() {
  return (
    <main className="flex-1 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-alu-text">
          Tableau de bord
        </h1>
        <p className="mt-0.5 text-sm text-alu-sub">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      <KPISection />
      <StockAlertsSection />
      <ImpayesSection />
    </main>
  )
}
