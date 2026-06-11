'use client'

import React from 'react'
import { TrendingDown, TrendingUp, BarChart3, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMontant } from '@/lib/utils'

interface KpiCardsProps {
  totalAchats: number
  totalRecettes: number
  beneficeBrut: number
  soldeCaisse: number
  loading?: boolean
}

interface KpiItem {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  valueColor: string
}

export function KpiCards({
  totalAchats,
  totalRecettes,
  beneficeBrut,
  soldeCaisse,
  loading,
}: KpiCardsProps) {
  const kpis: KpiItem[] = [
    {
      label: 'Total Achats',
      value: formatMontant(totalAchats),
      icon: <TrendingDown className="h-5 w-5 text-alu-danger" aria-hidden="true" />,
      iconBg: 'bg-alu-danger/10',
      valueColor: 'text-alu-danger',
    },
    {
      label: 'Total Recettes',
      value: formatMontant(totalRecettes),
      icon: <TrendingUp className="h-5 w-5 text-alu-success" aria-hidden="true" />,
      iconBg: 'bg-alu-success/10',
      valueColor: 'text-alu-success',
    },
    {
      label: 'Bénéfice Brut',
      value: formatMontant(beneficeBrut),
      icon: <BarChart3 className={`h-5 w-5 ${beneficeBrut >= 0 ? 'text-alu-success' : 'text-alu-danger'}`} aria-hidden="true" />,
      iconBg: beneficeBrut >= 0 ? 'bg-alu-success/10' : 'bg-alu-danger/10',
      valueColor: beneficeBrut >= 0 ? 'text-alu-success' : 'text-alu-danger',
    },
    {
      label: 'Solde Caisse',
      value: formatMontant(soldeCaisse),
      icon: <Wallet className="h-5 w-5 text-alu-accent" aria-hidden="true" />,
      iconBg: 'bg-alu-accent/10',
      valueColor: 'text-alu-accent',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4 sm:p-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.iconBg}`}>
              {kpi.icon}
            </div>
            <p className="mt-3 text-xs font-medium text-alu-sub">{kpi.label}</p>
            <p className={`mt-1 text-lg sm:text-xl font-bold tabular-nums ${kpi.valueColor}`}>
              {kpi.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}