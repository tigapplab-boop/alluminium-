import type { TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TableProps = TableHTMLAttributes<HTMLTableElement>

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          'w-full caption-bottom text-sm',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('border-b border-alu-border bg-alu-surface/50', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-alu-border/50 transition-colors hover:bg-alu-border/20',
        '[&:nth-child(even)]:bg-alu-border/5',
        '[&:nth-child(even):hover]:bg-alu-border/20',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-11 px-4 text-left align-middle font-medium text-alu-sub text-xs uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle text-alu-text',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}