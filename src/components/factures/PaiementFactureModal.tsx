'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useAddPaiementFacture } from '@/hooks/useFactures'
import { formatMontant } from '@/lib/utils'

const paiementSchema = z.object({
  montant: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  modePaiement: z.string().min(1, 'Le mode de paiement est requis'),
  notes: z.string().optional(),
})

type PaiementFormData = z.infer<typeof paiementSchema>

interface PaiementFactureModalProps {
  open: boolean
  onClose: () => void
  factureId: string
  resteAPayer: number
  onSuccess: () => void
}

const modePaiementOptions = [
  { value: 'espèces', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'chèque', label: 'Chèque' },
]

export function PaiementFactureModal({
  open,
  onClose,
  factureId,
  resteAPayer,
  onSuccess,
}: PaiementFactureModalProps) {
  const addPaiementMut = useAddPaiementFacture()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaiementFormData>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      montant: undefined,
      modePaiement: 'espèces',
      notes: '',
    },
  })

  const onSubmit = async (data: PaiementFormData) => {
    if (data.montant > resteAPayer) return

    try {
      await addPaiementMut.mutateAsync({
        id: factureId,
        payload: {
          montant: data.montant,
          modePaiement: data.modePaiement,
          notes: data.notes || undefined,
        },
      })
      reset()
      onSuccess()
      onClose()
    } catch {
      // handled by react-query
    }
  }

  const handleClose = () => {
    if (!addPaiementMut.isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Ajouter un paiement</DialogTitle>
        <DialogDescription>
          Reste à payer: <span className="font-semibold text-alu-text">{formatMontant(resteAPayer)}</span>
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody className="space-y-4">
          <Input
            label="Montant"
            type="number"
            step="0.01"
            min="0.01"
            max={resteAPayer}
            placeholder={`Max: ${formatMontant(resteAPayer)}`}
            {...register('montant', { valueAsNumber: true })}
            error={errors.montant?.message}
          />

          <Select
            label="Mode de paiement"
            options={modePaiementOptions}
            {...register('modePaiement')}
            error={errors.modePaiement?.message}
          />

          <Textarea
            label="Notes (optionnel)"
            placeholder="Notes sur le paiement..."
            rows={2}
            {...register('notes')}
          />
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={handleClose} disabled={addPaiementMut.isPending}>
            Annuler
          </Button>
          <Button type="submit" loading={addPaiementMut.isPending}>
            Enregistrer le paiement
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}