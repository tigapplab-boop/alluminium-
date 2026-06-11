'use client'

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value
      setLocalValue(newVal)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        onChange(newVal)
      }, 300)
    },
    [onChange]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-alu-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'flex h-10 w-full rounded-lg border border-alu-border bg-alu-bg pl-10 pr-4 py-2 text-sm',
          'text-alu-text placeholder:text-alu-muted',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent'
        )}
      />
    </div>
  )
}