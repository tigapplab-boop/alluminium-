'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCreateFacture } from '@/hooks/useFactures'
import { useClients } from '@/hooks/useClients'
import { formatMontant } from '@/lib/utils'

const ligneSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  description: z.string().optional(),
  unite: z.string().min(1, 'L\'unité est requise'),
  quantite: z.number().min(0.01, 'La quantité doit être > 0'),
  prixUnitaire: z.number().min(0, 'Le prix doit être ≥ 0'),
})

const factureSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  dateFacture: z.string().min(1, 'La date est requise'),
  dateEcheance: z.string().optional(),
  tva: z.number().min(0).max(100),
  notes: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne est requise'),
})

type FactureFormData = z.infer<typeof factureSchema>

const defaultLigne = {
  designation: '',
  description: '',
  unite: 'unité',
  quantite: 1,
  prixUnitaire: 0,
}

export default function NouvelleFacturePage() {
  const router = useRouter()
  const createFacture = useCreateFacture()
  const { data: clientsData, isLoading: clientsLoading } = useClients()

  const clients = clientsData?.data || []

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FactureFormData>({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      clientId: '',
      dateFacture: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      tva: 0,
      notes: '',
      lignes: [{ ...defaultLigne }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' })
  const lignes = watch('lignes')
  const tva = watch('tva')

  const montantHT = (lignes || []).reduce(
    (sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0),
    0
  )
  const montantTVA = montantHT * (Number(tva) || 0) / 100
  const montantTTC = montantHT + montantTVA

  const onSubmit = async (data: FactureFormData) => {
    try {
      const result = await createFacture.mutateAsync({
        clientId: data.clientId,
        dateFacture: data.dateFacture,
        dateEcheance: data.dateEcheance || undefined,
        tva: Number(data.tva),
        notes: data.notes || undefined,
        lignes: data.lignes.map((l, i) => ({
          designation: l.designation,
          description: l.description || undefined,
          unite: l.unite,
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
          ordre: i,
        })),
      })
      if (result.data) {
        router.push(`/factures/${result.data.id}`)
      }
    } catch {
      // handled by react-query
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle facture"
        action={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client & dates */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Client"
              options={[
                { value: '', label: clientsLoading ? 'Chargement...' : 'Sélectionner un client' },
                ...clients.map((c: { id: string; nom: string; prenom?: string | null }) => ({
                  value: c.id,
                  label: `${c.nom}${c.prenom ? ` ${c.prenom}` : ''}`,
                })),
              ]}
              disabled={clientsLoading}
              {...register('clientId')}
              error={errors.clientId?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date de la facture"
                type="date"
                max={today}
                {...register('dateFacture')}
                error={errors.dateFacture?.message}
              />
              <Input
                label="Date d'échéance (optionnel)"
                type="date"
                {...register('dateEcheance')}
                error={errors.dateEcheance?.message}
              />
            </div>

            <div className="w-32">
              <Input
                label="TVA %"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('tva', { valueAsNumber: true })}
                error={errors.tva?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lignes</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ...defaultLigne })}
              >
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-alu-border">
                    <th className="text-left py-2 pr-2 text-xs font-medium text-alu-sub uppercase w-8">N°</th>
                    <th className="text-left py-2 pr-2 text-xs font-medium text-alu-sub uppercase">Désignation *</th>
                    <th className="text-left py-2 pr-2 text-xs font-medium text-alu-sub uppercase hidden lg:table-cell">Description</th>
                    <th className="text-left py-2 pr-2 text-xs font-medium text-alu-sub uppercase w-20">Unité</th>
                    <th className="text-left py-2 pr-2 text-xs font-medium text-alu-sub uppercase w-24">Qté *</th>
                    <th className="text-left py-2 pr-2 text-xs font-medium text-alu-sub uppercase w-32">P.U. *</th>
                    <th className="text-right py-2 text-xs font-medium text-alu-sub uppercase w-28">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const qte = Number(lignes?.[index]?.quantite) || 0
                    const pu = Number(lignes?.[index]?.prixUnitaire) || 0
                    const lineTotal = qte * pu
                    return (
                      <tr key={field.id} className="border-b border-alu-border/50">
                        <td className="py-2 pr-2 text-alu-sub text-xs">{index + 1}</td>
                        <td className="py-2 pr-2">
                          <input
                            className="w-full h-9 rounded-md border border-alu-border bg-alu-bg px-2.5 text-sm text-alu-text placeholder:text-alu-muted focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                            placeholder="Désignation"
                            {...register(`lignes.${index}.designation`)}
                          />
                          {errors.lignes?.[index]?.designation && (
                            <p className="text-xs text-alu-danger mt-0.5">{errors.lignes[index].designation?.message}</p>
                          )}
                        </td>
                        <td className="py-2 pr-2 hidden lg:table-cell">
                          <input
                            className="w-full h-9 rounded-md border border-alu-border bg-alu-bg px-2.5 text-sm text-alu-text placeholder:text-alu-muted focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                            placeholder="Description"
                            {...register(`lignes.${index}.description`)}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            className="w-full h-9 rounded-md border border-alu-border bg-alu-bg px-2.5 text-sm text-alu-text focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                            {...register(`lignes.${index}.unite`)}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="w-full h-9 rounded-md border border-alu-border bg-alu-bg px-2.5 text-sm text-alu-text tabular-nums focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                            {...register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                          />
                          {errors.lignes?.[index]?.quantite && (
                            <p className="text-xs text-alu-danger mt-0.5">{errors.lignes[index].quantite?.message}</p>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full h-9 rounded-md border border-alu-border bg-alu-bg px-2.5 text-sm text-alu-text tabular-nums focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                            {...register(`lignes.${index}.prixUnitaire`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="py-2 text-right text-sm font-medium text-alu-text tabular-nums">
                          {formatMontant(lineTotal)}
                        </td>
                        <td className="py-2 pl-1">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-1.5 rounded-md text-alu-sub hover:text-alu-danger hover:bg-alu-danger/10 transition-colors"
                              aria-label="Supprimer la ligne"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards for lines */}
            <div className="md:hidden space-y-3">
              {fields.map((field, index) => {
                const qte = Number(lignes?.[index]?.quantite) || 0
                const pu = Number(lignes?.[index]?.prixUnitaire) || 0
                const lineTotal = qte * pu
                return (
                  <div key={field.id} className="rounded-lg border border-alu-border bg-alu-bg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-alu-sub">Ligne {index + 1}</span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 rounded-md text-alu-sub hover:text-alu-danger transition-colors"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <input
                      className="w-full h-9 rounded-md border border-alu-border bg-alu-surface px-2.5 text-sm text-alu-text placeholder:text-alu-muted focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                      placeholder="Désignation *"
                      {...register(`lignes.${index}.designation`)}
                    />
                    {errors.lignes?.[index]?.designation && (
                      <p className="text-xs text-alu-danger">{errors.lignes[index].designation?.message}</p>
                    )}
                    <input
                      className="w-full h-9 rounded-md border border-alu-border bg-alu-surface px-2.5 text-sm text-alu-text placeholder:text-alu-muted focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                      placeholder="Description"
                      {...register(`lignes.${index}.description`)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        className="h-9 rounded-md border border-alu-border bg-alu-surface px-2.5 text-sm text-alu-text focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                        placeholder="Unité"
                        {...register(`lignes.${index}.unite`)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="h-9 rounded-md border border-alu-border bg-alu-surface px-2.5 text-sm text-alu-text tabular-nums focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                        placeholder="Qté *"
                        {...register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-9 rounded-md border border-alu-border bg-alu-surface px-2.5 text-sm text-alu-text tabular-nums focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                        placeholder="P.U. *"
                        {...register(`lignes.${index}.prixUnitaire`, { valueAsNumber: true })}
                      />
                    </div>
                    {errors.lignes?.[index]?.quantite && (
                      <p className="text-xs text-alu-danger">{errors.lignes[index].quantite?.message}</p>
                    )}
                    <div className="text-right text-sm font-medium text-alu-text tabular-nums">
                      Total: {formatMontant(lineTotal)}
                    </div>
                  </div>
                )
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => append({ ...defaultLigne })}
              >
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>

            {errors.lignes && typeof errors.lignes.message === 'string' && (
              <p className="text-xs text-alu-danger mt-2">{errors.lignes.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center justify-between w-full sm:w-72 text-sm">
                <span className="text-alu-sub">Montant HT</span>
                <span className="font-medium text-alu-text tabular-nums">{formatMontant(montantHT)}</span>
              </div>
              <div className="flex items-center justify-between w-full sm:w-72 text-sm">
                <span className="text-alu-sub">TVA ({tva || 0}%)</span>
                <span className="font-medium text-alu-text tabular-nums">{formatMontant(montantTVA)}</span>
              </div>
              <Separator className="w-full sm:w-72" />
              <div className="flex items-center justify-between w-full sm:w-72">
                <span className="font-semibold text-alu-text">Montant TTC</span>
                <span className="text-lg font-bold text-alu-accent tabular-nums">{formatMontant(montantTTC)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="p-6">
            <Textarea
              label="Notes (optionnel)"
              placeholder="Notes ou conditions particulières..."
              rows={3}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={createFacture.isPending}>
            Enregistrer la facture
          </Button>
        </div>
      </form>
    </div>
  )
}