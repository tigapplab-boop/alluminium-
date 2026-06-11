'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useFactures } from '@/hooks/useFactures'
import { FactureCard } from '@/components/factures/FactureCard'
import type { Facture } from '@/types'

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PARTIELLEMENT_PAYEE', label: 'Partiellement payée' },
  { value: 'PAYEE', label: 'Payée' },
  { value: 'ANNULEE', label: 'Annulée' },
]

export default function FacturesListPage() {
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading, error, refetch } = useFactures({
    page,
    limit: 10,
    statut: statut || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const factureList = data?.data || []
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 }

  useEffect(() => {
    refetch()
  }, [page, statut, dateFrom, dateTo, refetch])

  const handleStatutChange = (value: string) => {
    setStatut(value)
    setPage(1)
  }

  const handleDateRangeChange = (range: { from: string; to: string }) => {
    setDateFrom(range.from)
    setDateTo(range.to)
    setPage(1)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        action={
          <Link href="/factures/nouvelle">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </Button>
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-56">
          <Select
            options={statutOptions}
            value={statut}
            onChange={(e) => handleStatutChange(e.target.value)}
            placeholder="Filtrer par statut"
          />
        </div>
        <div className="w-full sm:flex-1">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-alu-danger/30 bg-alu-danger/5 px-4 py-3 text-sm text-alu-danger">
          {error.message}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && factureList.length === 0 && (
        <EmptyState
          icon={<Receipt className="h-12 w-12" />}
          title="Aucune facture"
          description={
            statut || dateFrom || dateTo
              ? 'Aucune facture ne correspond à vos filtres'
              : 'Commencez par créer votre première facture'
          }
          action={
            !(statut || dateFrom || dateTo)
              ? { label: 'Créer une facture', onClick: () => {} }
              : undefined
          }
        />
      )}

      {/* Grid */}
      {!isLoading && factureList.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {factureList.map((facture: Facture) => (
              <FactureCard key={facture.id} facture={facture} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}