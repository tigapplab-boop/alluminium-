'use client'

import React, { useState, useCallback } from 'react'
import { Wallet, UserCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { SoldeCard } from '@/components/caisse/SoldeCard'
import { RetraitModal } from '@/components/caisse/RetraitModal'
import { TransactionList } from '@/components/caisse/TransactionList'
import { useSoldeCaisse, useTransactions, useCreateRetrait } from '@/hooks/useCaisse'
import { useAssocies } from '@/hooks/useAssocies'
import { formatMontant } from '@/lib/utils'
import type { Associe } from '@/types'

export default function CaissePage() {
  // Solde
  const { data: soldeData, isLoading: soldeLoading, error: soldeError } = useSoldeCaisse()
  const solde = soldeData?.data
  const soldeCaisse = solde?.solde ?? 0

  // Transactions
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const txParams = {
    page,
    limit: 10,
    type: typeFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const {
    data: txData,
    isLoading: txLoading,
    error: txError,
  } = useTransactions(txParams)

  // Associés
  const { data: associesData, isLoading: associesLoading } = useAssocies()
  const associes = associesData?.data ?? []

  // Retrait modal
  const [retraitAssocie, setRetraitAssocie] = useState<Associe | null>(null)
  const createRetrait = useCreateRetrait()

  const handleRetraitSubmit = async (payload: { associeId: string; montant: number; notes?: string }) => {
    await createRetrait.mutateAsync(payload)
  }

  const handleTypeChange = useCallback((value: string) => {
    setTypeFilter(value)
    setPage(1)
  }, [])

  const handleDateRangeChange = useCallback((range: { from: string; to: string }) => {
    setDateFrom(range.from)
    setDateTo(range.to)
    setPage(1)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Caisse" />

      {/* Section Solde */}
      <SoldeCard
        solde={solde}
        loading={soldeLoading}
        error={soldeError?.message}
      />

      {/* Section Associés */}
      <section aria-label="Associés">
        <h2 className="text-base font-semibold text-alu-text mb-3 flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-alu-accent" aria-hidden="true" />
          Associés
        </h2>

        {associesLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!associesLoading && associes.length === 0 && (
          <EmptyState
            icon={<UserCircle className="h-12 w-12" />}
            title="Aucun associé"
            description="Ajoutez des associés pour gérer les retraits"
          />
        )}

        {!associesLoading && associes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {associes.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-alu-text truncate">
                        {a.prenom} {a.nom}
                      </p>
                      <p className="text-xs text-alu-sub mt-0.5">
                        Part : <span className="font-medium text-alu-text">{a.partPct}%</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-alu-sub">Total retiré</p>
                      <p className="text-sm font-semibold text-orange-400 tabular-nums mt-0.5">
                        {formatMontant(a.totalRetire ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setRetraitAssocie(a)}
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Retrait
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section Transactions */}
      <section aria-label="Transactions">
        <h2 className="text-base font-semibold text-alu-text mb-3">
          Historique des Transactions
        </h2>
        <TransactionList
          transactions={txData}
          loading={txLoading}
          error={txError?.message ?? null}
          typeFilter={typeFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          page={page}
          onTypeChange={handleTypeChange}
          onDateRangeChange={handleDateRangeChange}
          onPageChange={setPage}
        />
      </section>

      {/* Retrait Modal */}
      <RetraitModal
        open={retraitAssocie !== null}
        onClose={() => setRetraitAssocie(null)}
        associe={retraitAssocie}
        soldeCaisse={soldeCaisse}
        onSubmit={handleRetraitSubmit}
      />
    </div>
  )
}