import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-alu-muted">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-alu-text">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-alu-sub">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}