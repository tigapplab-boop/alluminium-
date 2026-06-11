import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'NON_PAYE'
  | 'PARTIELLEMENT_PAYE'
  | 'PAYE'
  | 'EN_ATTENTE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'ANNULEE'
  | 'BROUILLON'
  | 'ENVOYE'
  | 'ACCEPTE'
  | 'REFUSE'
  | 'CONVERTI'
  | 'ENTREE'
  | 'SORTIE'
  | 'RETRAIT'
  | 'AJUSTEMENT'
  | 'PROFILE_ALU'
  | 'VITRAGE'
  | 'JOINT'
  | 'QUINCAILLERIE'
  | 'COLLE_MOUSSE'
  | 'MOTEUR_VOLET'
  | 'AUTRE'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant
}

const badgeConfig: Record<BadgeVariant, { label: string; className: string }> = {
  NON_PAYE: {
    label: 'Non payé',
    className: 'bg-alu-danger/10 text-alu-danger',
  },
  PARTIELLEMENT_PAYE: {
    label: 'Partiel',
    className: 'bg-alu-warning/10 text-alu-warning',
  },
  PAYE: {
    label: 'Payé',
    className: 'bg-alu-success/10 text-alu-success',
  },
  EN_ATTENTE: {
    label: 'En attente',
    className: 'bg-alu-muted/20 text-alu-sub',
  },
  PARTIELLEMENT_PAYEE: {
    label: 'Partiel',
    className: 'bg-alu-warning/10 text-alu-warning',
  },
  PAYEE: {
    label: 'Payée',
    className: 'bg-alu-success/10 text-alu-success',
  },
  ANNULEE: {
    label: 'Annulée',
    className: 'bg-alu-danger/10 text-alu-danger',
  },
  BROUILLON: {
    label: 'Brouillon',
    className: 'bg-alu-muted/20 text-alu-sub',
  },
  ENVOYE: {
    label: 'Envoyé',
    className: 'bg-alu-accent/10 text-alu-accent',
  },
  ACCEPTE: {
    label: 'Accepté',
    className: 'bg-alu-success/10 text-alu-success',
  },
  REFUSE: {
    label: 'Refusé',
    className: 'bg-alu-danger/10 text-alu-danger',
  },
  CONVERTI: {
    label: 'Converti',
    className: 'bg-alu-accent/10 text-alu-accent',
  },
  ENTREE: {
    label: 'Entrée',
    className: 'bg-alu-success/10 text-alu-success',
  },
  SORTIE: {
    label: 'Sortie',
    className: 'bg-alu-danger/10 text-alu-danger',
  },
  RETRAIT: {
    label: 'Retrait',
    className: 'bg-orange-500/10 text-orange-400',
  },
  AJUSTEMENT: {
    label: 'Ajustement',
    className: 'bg-alu-muted/20 text-alu-sub',
  },
  PROFILE_ALU: {
    label: 'Profil alu',
    className: 'bg-alu-accent/10 text-alu-accent',
  },
  VITRAGE: {
    label: 'Vitrage',
    className: 'bg-sky-500/10 text-sky-500',
  },
  JOINT: {
    label: 'Joint',
    className: 'bg-alu-muted/20 text-alu-sub',
  },
  QUINCAILLERIE: {
    label: 'Quincaillerie',
    className: 'bg-amber-500/10 text-amber-500',
  },
  COLLE_MOUSSE: {
    label: 'Colle mousse',
    className: 'bg-gray-400/10 text-gray-500',
  },
  MOTEUR_VOLET: {
    label: 'Moteur volet',
    className: 'bg-purple-500/10 text-purple-500',
  },
  AUTRE: {
    label: 'Autre',
    className: 'bg-alu-muted/20 text-alu-sub',
  },
}

export function Badge({ variant, className, ...props }: BadgeProps) {
  const config = badgeConfig[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        config.className,
        className
      )}
      {...props}
    >
      {config.label}
    </span>
  )
}