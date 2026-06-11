'use client'

import React, { useState, useMemo } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { BarChart3, Users } from 'lucide-react'
import { KpiCards } from '@/components/comptabilite/KpiCards'
import { BilanChart } from '@/components/comptabilite/BilanChart'
import { useBilan, useMensuel } from '@/hooks/useComptabilite'
import { formatMontant } from '@/lib/utils'

function getMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { from: fmt(firstDay), to: fmt(lastDay) }
}

const initial = getMonthRange()

export default function ComptabilitePage() {
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)

  // Bilan
  const { data: bilanData, isLoading: bilanLoading, error: bilanError } = useBilan(from, to)
  const bilan = bilanData?.data

  // Mensuel chart
  const { data: mensuelData, isLoading: chartLoading, error: chartError } = useMensuel()
  const mensuel = mensuelData?.data

  // Repartition calculations
  const repartition = useMemo(() => {
    if (!bilan || !bilan.retraitsAssocies) return []

    return bilan.retraitsAssocies.map((a) => {
      const ecart = a.totalRetire - a.partTheorique
      return {
        ...a,
        ecart,
      }
    })
  }, [bilan])

  return (
    <div className="space-y-6">
      <PageHeader title="Comptabilité" />

      {/* Bilan Période */}
      <section aria-label="Bilan période">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-alu-text flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-alu-accent" aria-hidden="true" />
            Bilan de Période
          </h2>
          <DateRangePicker
            from={from}
            to={to}
            onChange={(range) => {
              setFrom(range.from)
              setTo(range.to)
            }}
          />
        </div>

        {/* Error */}
        {bilanError && (
          <div className="rounded-lg border border-alu-danger/30 bg-alu-danger/5 px-4 py-3 text-sm text-alu-danger mb-4">
            {bilanError.message}
          </div>
        )}

        {/* KPI Cards */}
        <KpiCards
          totalAchats={bilan?.totalAchats ?? 0}
          totalRecettes={bilan?.totalRecettes ?? 0}
          beneficeBrut={bilan?.beneficeBrut ?? 0}
          soldeCaisse={bilan?.soldeCaisse ?? 0}
          loading={bilanLoading}
        />
      </section>

      {/* Répartition Retraits Associés */}
      <section aria-label="Répartition retraits associés">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-alu-accent" aria-hidden="true" />
              Répartition Retraits Associés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bilanLoading && (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!bilanLoading && (!bilan || repartition.length === 0) && (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="Aucun associé"
                description="Aucune donnée de répartition disponible pour cette période"
              />
            )}

            {!bilanLoading && repartition.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Associé</TableHead>
                      <TableHead className="text-center">Part %</TableHead>
                      <TableHead className="text-right">Total Retiré</TableHead>
                      <TableHead className="text-right">Part Théorique</TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repartition.map((row) => {
                      const ecartColor =
                        row.ecart > 0
                          ? 'text-alu-danger'
                          : row.ecart < 0
                            ? 'text-alu-success'
                            : 'text-alu-sub'

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {row.prenom} {row.nom}
                          </TableCell>
                          <TableCell className="text-center text-alu-sub">
                            {row.partPct}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMontant(row.totalRetire)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-alu-sub">
                            {formatMontant(row.partTheorique)}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums font-semibold ${ecartColor}`}>
                            {row.ecart > 0 ? '+' : ''}
                            {formatMontant(row.ecart)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Graphique Mensuel */}
      <section aria-label="Graphique mensuel">
        <BilanChart
          data={mensuel}
          loading={chartLoading}
          error={chartError?.message}
        />
      </section>
    </div>
  )
}