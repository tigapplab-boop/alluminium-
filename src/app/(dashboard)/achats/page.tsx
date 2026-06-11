'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useAchats } from '@/hooks/useAchats'
import { AchatCard, AchatCardSkeleton, AchatsEmptyState } from '@/components/achats/AchatCard'
import type { Achat } from '@/types'

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'NON_PAYE', label: 'Non payés' },
  { value: 'PARTIELLEMENT_PAYE', label: 'Partiellement payés' },
  { value: 'PAYE', label: 'Payés' },
]

export default function AchatsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statut, setStatut] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const { data, isLoading, isError, error } = useAchats({
    page,
    limit: 10,
    statut: statut || undefined,
    dateFrom: dateRange.from || undefined,
    dateTo: dateRange.to || undefined,
  })

  const achats = data?.data || []
  const pagination = data?.pagination

  const handleStatutChange = (val: string) => {
    setStatut(val)
    setPage(1)
  }

  const handleDateChange = (range: { from: string; to: string }) => {
    setDateRange(range)
    setPage(1)
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Achats"
        action={
          <Button
            onClick={() => router.push('/achats/nouveau')}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Nouvel achat
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="w-full sm:w-48">
          <Select
            options={statutOptions}
            value={statut}
            onChange={(e) => handleStatutChange(e.target.value)}
            placeholder="Statut"
          />
        </div>
        <div className="flex-1 w-full">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onChange={handleDateChange}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AchatCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 p-6 text-center">
          <p className="text-sm text-alu-danger">
            {error?.message || 'Une erreur est survenue lors du chargement des achats.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </div>
      ) : achats.length === 0 ? (
        <AchatsEmptyState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achats.map((achat: Achat) => (
              <AchatCard key={achat.id} achat={achat} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </main>
  )
}