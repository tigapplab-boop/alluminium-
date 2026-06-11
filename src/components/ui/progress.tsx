import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  colorClass?: string
  size?: 'sm' | 'md'
}

export function Progress({
  value,
  max = 100,
  colorClass = 'bg-alu-accent',
  size = 'md',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('w-full rounded-full bg-alu-border overflow-hidden', sizeStyles[size], className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-300 ease-out', colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}