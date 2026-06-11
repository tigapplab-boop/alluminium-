import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  action?: React.ReactNode
  subtitle?: string
  className?: string
}

export function PageHeader({
  title,
  action,
  subtitle,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
        className
      )}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-alu-text">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-alu-sub">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}