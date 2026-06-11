import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMontant(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DA'
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calcStatutPaiement(montantPaye: number, montantTotal: number): 'NON_PAYE' | 'PARTIELLEMENT_PAYE' | 'PAYE' {
  if (montantPaye === 0) return 'NON_PAYE'
  if (montantPaye >= montantTotal) return 'PAYE'
  return 'PARTIELLEMENT_PAYE'
}

export function calcStatutFacture(montantPaye: number, montantTotal: number): 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' {
  if (montantPaye === 0) return 'EN_ATTENTE'
  if (montantPaye >= montantTotal) return 'PAYEE'
  return 'PARTIELLEMENT_PAYEE'
}
