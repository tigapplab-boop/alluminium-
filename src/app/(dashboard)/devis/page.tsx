'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useDevis } from '@/hooks/useDevis'
import { DevisCard } from '@/components/devis/DevisCard'
import type { Devis } from '@/types'

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'ENVOYE', label: 'Envoyé' },
  { value: 'ACCEPTE', label: 'Accepté' },
  { value: 'REFUSE', label: 'Refusé' },
  { value: 'CONVERTI', label: 'Converti' },
]

export default function DevisListPage() {
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useDevis({
    page,
    limit: 10,
    statut: statut || undefined,
  })

  const devisList = data?.data || []
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 }

  useEffect(() => {
    refetch()
  }, [page, statut, refetch])

  const handleStatutChange = (value: string) => {
    setStatut(value)
    setPage(1)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devis"
        action={
          <Link href="/devis/nouveau">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau devis
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
      {!isLoading && !error && devisList.length === 0 && (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Aucun devis"
          description={
            statut
              ? `Aucun devis avec le statut "${statutOptions.find(s => s.value === statut)?.label}"`
              : 'Commencez par créer votre premier devis'
          }
          action={
            !statut
              ? { label: 'Créer un devis', onClick: () => {} }
              : undefined
          }
        />
      )}

      {/* Grid */}
      {!isLoading && devisList.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {devisList.map((devis: Devis) => (
              <DevisCard key={devis.id} devis={devis} />
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