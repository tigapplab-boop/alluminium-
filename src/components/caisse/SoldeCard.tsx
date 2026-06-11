'use client'

import React from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMontant } from '@/lib/utils'
import type { SoldeCaisse } from '@/types'

interface SoldeCardProps {
  solde: SoldeCaisse | undefined
  loading?: boolean
  error?: string
}

export function SoldeCard({ solde, loading, error }: SoldeCardProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-alu-danger/30 bg-alu-danger/5 p-6">
        <p className="text-sm text-alu-danger">{error}</p>
      </div>
    )
  }

  if (loading || !solde) {
    return (
      <div className="rounded-xl border border-alu-border brushed-metal p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-alu-border brushed-metal p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-alu-accent/15">
          <Wallet className="h-5 w-5 text-alu-accent" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-medium text-alu-sub uppercase tracking-wider">
          Solde de Caisse
        </h2>
      </div>

      {/* Big solde amount */}
      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-alu-accent tabular-nums tracking-tight">
        {formatMontant(solde.solde)}
      </p>

      {/* Sub-stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
        <SubStat
          icon={<ArrowDownLeft className="h-4 w-4 text-alu-success" aria-hidden="true" />}
          label="Entrées"
          value={solde.totalEntrees}
          colorClass="text-alu-success"
          bgClass="bg-alu-success/10"
        />
        <SubStat
          icon={<ArrowUpRight className="h-4 w-4 text-alu-danger" aria-hidden="true" />}
          label="Sorties"
          value={solde.totalSorties}
          colorClass="text-alu-danger"
          bgClass="bg-alu-danger/10"
        />
        <SubStat
          icon={<ArrowLeftRight className="h-4 w-4 text-orange-400" aria-hidden="true" />}
          label="Retraits"
          value={solde.totalRetraits}
          colorClass="text-orange-400"
          bgClass="bg-orange-500/10"
        />
      </div>
    </div>
  )
}

interface SubStatProps {
  icon: React.ReactNode
  label: string
  value: number
  colorClass: string
  bgClass: string
}

function SubStat({ icon, label, value, colorClass, bgClass }: SubStatProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-alu-bg/40 border border-alu-border/50 px-4 py-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${bgClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-alu-sub">{label}</p>
        <p className={`text-sm font-semibold tabular-nums ${colorClass}`}>
          {formatMontant(value)}
        </p>
      </div>
    </div>
  )
}