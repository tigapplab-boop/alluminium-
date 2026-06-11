'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  rightAction?: React.ReactNode
  className?: string
}

export function Header({ rightAction, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center px-4 lg:hidden',
        'bg-alu-surface border-b border-alu-border',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-alu-accent/10">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-alu-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-base font-semibold text-alu-text">
          AluAtelier
        </span>
      </div>

      {rightAction && (
        <div className="ml-auto">{rightAction}</div>
      )}
    </header>
  )
}