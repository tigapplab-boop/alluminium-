'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-alu-sub"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-alu-border bg-alu-bg px-3 py-2 text-sm',
            'text-alu-text placeholder:text-alu-muted',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-alu-danger focus:ring-alu-danger/50 focus:border-alu-danger',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-alu-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'