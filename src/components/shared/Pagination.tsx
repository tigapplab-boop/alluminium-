'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = (): (number | '...')[] => {
    const pages: (number | '...')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(1)

    if (page > 3) {
      pages.push('...')
    }

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) {
      pages.push('...')
    }

    pages.push(totalPages)

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <nav
      className={cn('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors',
          'text-alu-sub hover:bg-alu-border/50 hover:text-alu-text',
          'disabled:opacity-40 disabled:pointer-events-none'
        )}
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {visiblePages.map((p, i) => {
        if (p === '...') {
          return (
            <span
              key={`ellipsis-${i}`}
              className="flex h-9 w-9 items-center justify-center text-sm text-alu-muted"
              aria-hidden="true"
            >
              …
            </span>
          )
        }

        const isActive = p === page
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-alu-accent text-white'
                : 'text-alu-sub hover:bg-alu-border/50 hover:text-alu-text'
            )}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors',
          'text-alu-sub hover:bg-alu-border/50 hover:text-alu-text',
          'disabled:opacity-40 disabled:pointer-events-none'
        )}
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}