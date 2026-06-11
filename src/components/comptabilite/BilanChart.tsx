'use client'

import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import type { MensuelData } from '@/types'

interface BilanChartProps {
  data: MensuelData[] | undefined
  loading?: boolean
  error?: string
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fév',
  '03': 'Mar',
  '04': 'Avr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aoû',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Déc',
}

const formatDZD = (value: number): string => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' DA'
}

interface TooltipPayloadItem {
  color: string
  name: string
  value: number
  dataKey: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-alu-border bg-alu-surface px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-alu-text mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-xs text-alu-sub">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-alu-text tabular-nums">
              {formatDZD(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomLegend({
  payload,
}: {
  payload?: { value: string; color: string; dataKey?: string }[]
}) {
  if (!payload) return null

  return (
    <div className="flex items-center justify-center gap-5 pt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-xs text-alu-sub">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function BilanChart({ data, loading, error }: BilanChartProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-alu-danger/30 bg-alu-danger/5 p-6 text-center">
        <p className="text-sm text-alu-danger">{error}</p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="rounded-xl border border-alu-border bg-alu-surface p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-alu-border bg-alu-surface p-12 text-center">
        <p className="text-sm text-alu-sub">Aucune donnée mensuelle disponible</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: MONTH_LABELS[d.mois] ?? d.mois,
  }))

  return (
    <div className="rounded-xl border border-alu-border bg-alu-surface p-4 sm:p-6">
      <h3 className="text-base font-semibold text-alu-text mb-4">
        Graphique Mensuel
      </h3>
      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1F2A3C"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#1F2A3C' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={{ stroke: '#1F2A3C' }}
              tickLine={false}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat('fr-DZ', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(v)
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(31, 42, 60, 0.5)' }}
            />
            <Legend content={<CustomLegend />} />
            <Bar
              dataKey="achats"
              name="Achats"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="recettes"
              name="Recettes"
              fill="#22C55E"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="benefice"
              name="Bénéfice"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}