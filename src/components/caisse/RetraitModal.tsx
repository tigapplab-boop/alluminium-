'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import type { Associe } from '@/types'

interface RetraitModalProps {
  open: boolean
  onClose: () => void
  associe: Associe | null
  soldeCaisse: number
  onSubmit: (payload: { associeId: string; montant: number; notes?: string }) => Promise<void>
}

export function RetraitModal({
  open,
  onClose,
  associe,
  soldeCaisse,
  onSubmit,
}: RetraitModalProps) {
  const [montant, setMontant] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const montantNum = parseFloat(montant) || 0
  const exceedsSolde = montantNum > soldeCaisse
  const isInvalid = montantNum <= 0
  const canSubmit = !isInvalid && !exceedsSolde && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!associe || !canSubmit) return

    setError('')
    setSubmitting(true)
    try {
      await onSubmit({
        associeId: associe.id,
        montant: montantNum,
        notes: notes.trim() || undefined,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du retrait')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setMontant('')
    setNotes('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Retrait — {associe ? `${associe.prenom} ${associe.nom}` : ''}</DialogTitle>
          <DialogDescription>
            Effectuer un retrait de la caisse pour cet associé.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Info banner */}
          <div className="rounded-lg bg-alu-border/30 border border-alu-border/50 px-4 py-3">
            <p className="text-xs text-alu-sub">
              Solde caisse disponible:{' '}
              <span className="font-semibold text-alu-text tabular-nums">
                {new Intl.NumberFormat('fr-DZ', {
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(soldeCaisse)} DA
              </span>
            </p>
            {associe && (
              <p className="text-xs text-alu-sub mt-1">
                Part de l&apos;associé: <span className="font-semibold text-alu-text">{associe.partPct}%</span>
              </p>
            )}
          </div>

          {/* Montant */}
          <Input
            label="Montant du retrait (DA)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={montant}
            onChange={(e) => {
              setMontant(e.target.value)
              setError('')
            }}
            error={
              isInvalid && montant !== ''
                ? 'Le montant doit être supérieur à 0'
                : undefined
            }
          />

          {/* Warning if exceeds solde */}
          {exceedsSolde && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm text-orange-400">
                Le montant dépasse le solde disponible de la caisse ({new Intl.NumberFormat('fr-DZ', {
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(soldeCaisse)} DA).
              </p>
            </div>
          )}

          {/* Notes */}
          <Textarea
            label="Notes (optionnel)"
            placeholder="Raison ou note du retrait..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {/* Server error */}
          {error && (
            <div className="rounded-lg border border-alu-danger/30 bg-alu-danger/5 px-4 py-3">
              <p className="text-sm text-alu-danger">{error}</p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button type="submit" loading={submitting} disabled={!canSubmit}>
            Confirmer le retrait
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}