'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard } from '@/components/ui/skeleton'
import { formatMontant, formatDateTime } from '@/lib/utils'
import type { TransactionCaisse, TypeTransaction, PaginatedResponse } from '@/types'
import { ScrollText } from 'lucide-react'

const typeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'ENTREE', label: 'Entrées' },
  { value: 'SORTIE', label: 'Sorties' },
  { value: 'RETRAIT', label: 'Retraits' },
  { value: 'AJUSTEMENT', label: 'Ajustements' },
]

interface TransactionListProps {
  transactions: PaginatedResponse<TransactionCaisse> | undefined
  loading: boolean
  error: string | null
  typeFilter: string
  dateFrom: string
  dateTo: string
  page: number
  onTypeChange: (value: string) => void
  onDateRangeChange: (range: { from: string; to: string }) => void
  onPageChange: (page: number) => void
}

export function TransactionList({
  transactions,
  loading,
  error,
  typeFilter,
  dateFrom,
  dateTo,
  page,
  onTypeChange,
  onDateRangeChange,
  onPageChange,
}: TransactionListProps) {
  const hasFilters = typeFilter || dateFrom || dateTo

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-48">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:flex-1">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={onDateRangeChange}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-alu-danger/30 bg-alu-danger/5 px-4 py-3 text-sm text-alu-danger">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="!p-4" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && transactions && transactions.data.length === 0 && (
        <EmptyState
          icon={<ScrollText className="h-12 w-12" />}
          title="Aucune transaction"
          description={
            hasFilters
              ? 'Aucune transaction ne correspond à vos filtres'
              : 'Aucune transaction enregistrée'
          }
        />
      )}

      {/* Transaction list */}
      {!loading && !error && transactions && transactions.data.length > 0 && (
        <>
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {transactions.data.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={transactions.pagination.totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: TransactionCaisse }) {
  const montantColor =
    transaction.type === 'ENTREE'
      ? 'text-alu-success'
      : transaction.type === 'SORTIE' || transaction.type === 'RETRAIT'
        ? 'text-alu-danger'
        : 'text-alu-sub'

  const montantPrefix = transaction.type === 'ENTREE' ? '+' : '-'

  return (
    <div className="flex items-center gap-3 sm:gap-4 rounded-lg border border-alu-border/50 bg-alu-surface px-4 py-3 transition-colors hover:bg-alu-border/20">
      {/* Type badge */}
      <Badge variant={transaction.type as TypeTransaction} />

      {/* Description + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-alu-text truncate">
          {transaction.description}
        </p>
        <p className="text-xs text-alu-sub mt-0.5">
          {formatDateTime(transaction.dateTransaction)}
        </p>
      </div>

      {/* Montant */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${montantColor}`}>
          {montantPrefix}{formatMontant(transaction.montant)}
        </p>
        <p className="text-xs text-alu-sub tabular-nums mt-0.5">
          Solde: {formatMontant(transaction.soldeApres)}
        </p>
      </div>
    </div>
  )
}