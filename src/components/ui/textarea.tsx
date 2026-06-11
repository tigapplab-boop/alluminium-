'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-alu-sub"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-alu-border bg-alu-bg px-3 py-2 text-sm',
            'text-alu-text placeholder:text-alu-muted',
            'transition-colors duration-150 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error &&
              'border-alu-danger focus:ring-alu-danger/50 focus:border-alu-danger',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-alu-danger"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'