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
import { formatMontant } from '@/lib/utils'
import { useAddPaiementAchat } from '@/hooks/useAchats'

const paiementSchema = z.object({
  montant: z.number().positive('Le montant doit être supérieur à 0'),
  datePaiement: z.string().min(1, 'La date est requise'),
  modePaiement: z.string().min(1, 'Le mode de paiement est requis'),
  notes: z.string().optional(),
})

type PaiementForm = z.infer<typeof paiementSchema>

const modePaiementOptions = [
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'carte', label: 'Carte bancaire' },
]

interface PaiementAchatModalProps {
  open: boolean
  onClose: () => void
  achatId: string
  resteAPayer: number
}

export function PaiementAchatModal({
  open,
  onClose,
  achatId,
  resteAPayer,
}: PaiementAchatModalProps) {
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaiementForm>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      montant: undefined,
      datePaiement: new Date().toISOString().split('T')[0],
      modePaiement: 'especes',
      notes: '',
    },
  })

  const addPaiement = useAddPaiementAchat()

  const onSubmit = async (data: PaiementForm) => {
    setServerError('')

    if (data.montant > resteAPayer) {
      setServerError(
        `Le montant ne peut pas dépasser le reste à payer (${formatMontant(resteAPayer)})`
      )
      return
    }

    try {
      await addPaiement.mutateAsync({
        id: achatId,
        payload: {
          montant: data.montant,
          modePaiement: data.modePaiement,
          notes: data.notes || undefined,
        },
      })
      reset()
      onClose()
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Erreur lors du paiement'
      )
    }
  }

  const handleClose = () => {
    if (!addPaiement.isPending) {
      setServerError('')
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Ajouter un paiement</DialogTitle>
        <DialogDescription>
          Reste à payer :{' '}
          <span className="font-semibold text-alu-danger">
            {formatMontant(resteAPayer)}
          </span>
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <form
          id="paiement-achat-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {serverError && (
            <div className="rounded-lg bg-alu-danger/10 border border-alu-danger/20 px-4 py-3 text-sm text-alu-danger">
              {serverError}
            </div>
          )}

          <Input
            label="Montant *"
            type="number"
            step="0.01"
            placeholder={`Max: ${formatMontant(resteAPayer)}`}
            {...register('montant', { valueAsNumber: true })}
            error={errors.montant?.message}
          />

          <Input
            label="Date de paiement *"
            type="date"
            {...register('datePaiement')}
            error={errors.datePaiement?.message}
          />

          <Select
            label="Mode de paiement *"
            options={modePaiementOptions}
            {...register('modePaiement')}
            error={errors.modePaiement?.message}
          />

          <Textarea
            label="Notes"
            placeholder="Notes optionnelles..."
            rows={2}
            {...register('notes')}
          />
        </form>
      </DialogBody>

      <DialogFooter>
        <Button
          variant="ghost"
          onClick={handleClose}
          disabled={addPaiement.isPending}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          form="paiement-achat-form"
          loading={addPaiement.isPending}
        >
          Enregistrer le paiement
        </Button>
      </DialogFooter>
    </Dialog>
  )
}