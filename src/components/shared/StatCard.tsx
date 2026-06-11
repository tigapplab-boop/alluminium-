import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
  colorClass?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  colorClass = 'text-alu-accent',
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          {icon && (
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg bg-alu-border/50',
                colorClass
              )}
            >
              {icon}
            </div>
          )}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
                trend.value >= 0
                  ? 'text-alu-success bg-alu-success/10'
                  : 'text-alu-danger bg-alu-danger/10'
              )}
            >
              {trend.value >= 0 ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
              {Math.abs(trend.value).toFixed(1)}%
              {trend.label && (
                <span className="hidden sm:inline text-alu-sub ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-alu-sub">{title}</p>
          <p className="mt-1 text-2xl font-bold text-alu-text tabular-nums">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}