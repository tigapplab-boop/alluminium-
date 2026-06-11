'use client'

import React, { useEffect, useCallback, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Sheet({ open, onClose, children, className }: SheetProps) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseRef.current()
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel - slides up from bottom */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-2xl border-t border-alu-border bg-alu-surface shadow-2xl',
          'flex flex-col animate-[slideUp_200ms_ease-out]',
          className
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-alu-muted" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-alu-sub hover:text-alu-text hover:bg-alu-border/50 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  )
}

export function SheetHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 pb-4 pt-2', className)} {...props}>
      {children}
    </div>
  )
}

export function SheetTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold text-alu-text', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export function SheetBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  )
}

export function SheetFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-t border-alu-border px-6 py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}