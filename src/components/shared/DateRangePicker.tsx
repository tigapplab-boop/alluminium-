'use client'

import React from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  className?: string
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3', className)}>
      <div className="relative flex-1 w-full">
        <Calendar
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-alu-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className={cn(
            'flex h-10 w-full rounded-lg border border-alu-border bg-alu-bg pl-10 pr-3 py-2 text-sm',
            'text-alu-text',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent'
          )}
          aria-label="Date début"
        />
      </div>
      <span className="text-alu-sub text-sm hidden sm:block">→</span>
      <div className="relative flex-1 w-full">
        <Calendar
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-alu-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className={cn(
            'flex h-10 w-full rounded-lg border border-alu-border bg-alu-bg pl-10 pr-3 py-2 text-sm',
            'text-alu-text',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent'
          )}
          aria-label="Date fin"
        />
      </div>
    </div>
  )
}