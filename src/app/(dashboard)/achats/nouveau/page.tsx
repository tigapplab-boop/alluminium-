'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateAchat } from '@/hooks/useAchats'
import { useFournisseurs, useProduits } from '@/hooks/useFournisseursProduits'
import { formatMontant } from '@/lib/utils'

const ligneSchema = z.object({
  designation: z.string().min(1, 'Désignation requise'),
  produitId: z.string().optional(),
  quantite: z.number().min(0.01, 'Quantité > 0'),
  prixUnitaire: z.number().min(0, 'Prix ≥ 0'),
})

const achatSchema = z.object({
  fournisseurId: z.string().min(1, 'Fournisseur requis'),
  dateAchat: z.string().min(1, 'Date requise'),
  notes: z.string().optional(),
  lignes: z
    .array(ligneSchema)
    .min(1, 'Au moins une ligne est requise'),
})

type AchatFormData = z.infer<typeof achatSchema>

export default function NouvelAchatPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [newFournisseurMode, setNewFournisseurMode] = useState(false)
  const [newFournisseurName, setNewFournisseurName] = useState('')
  const [newFournisseurTel, setNewFournisseurTel] = useState('')
  const [newFournisseurWilaya, setNewFournisseurWilaya] = useState('')

  const { data: fournisseursData } = useFournisseurs()
  const { data: produitsData } = useProduits()
  const createAchat = useCreateAchat()

  const fournisseurs = fournisseursData?.data || []
  const produits = produitsData?.data || []

  const fournisseurOptions = fournisseurs.map((f) => ({
    value: f.id,
    label: f.nom,
  }))

  const produitOptions = produits.map((p) => ({
    value: p.id,
    label: `${p.designation}${p.reference ? ` (${p.reference})` : ''} — ${formatMontant(p.prixUnitaire)}`,
  }))

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AchatFormData>({
    resolver: zodResolver(achatSchema),
    defaultValues: {
      fournisseurId: '',
      dateAchat: new Date().toISOString().split('T')[0],
      notes: '',
      lignes: [
        { designation: '', produitId: '', quantite: 1, prixUnitaire: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lignes',
  })

  const lignes = watch('lignes')

  const totalGeneral = (lignes || []).reduce(
    (sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0),
    0
  )

  const handleProduitSelect = useCallback(
    (produitId: string, index: number) => {
      const produit = produits.find((p) => p.id === produitId)
      if (produit) {
        setValue(`lignes.${index}.designation`, produit.designation)
        setValue(`lignes.${index}.prixUnitaire`, produit.prixUnitaire)
      }
    },
    [produits, setValue]
  )

  const onSubmit = async (data: AchatFormData) => {
    setServerError('')
    try {
      const payload = {
        fournisseurId: data.fournisseurId,
        dateAchat: data.dateAchat,
        notes: data.notes || undefined,
        lignes: data.lignes.map((l) => ({
          designation: l.designation,
          produitId: l.produitId || undefined,
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
        })),
      }
      await createAchat.mutateAsync(payload)
      router.push('/achats')
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Erreur lors de la création'
      )
    }
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Nouvel achat"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/achats')}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      {serverError && (
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 px-4 py-3 text-sm text-alu-danger">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Supplier & Date */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!newFournisseurMode ? (
              <div className="space-y-3">
                <Select
                  label="Fournisseur *"
                  placeholder="Sélectionner un fournisseur"
                  options={fournisseurOptions}
                  {...register('fournisseurId')}
                  error={errors.fournisseurId?.message}
                />
                <button
                  type="button"
                  className="text-xs text-alu-accent hover:text-alu-accent2 transition-colors"
                  onClick={() => setNewFournisseurMode(true)}
                >
                  + Créer un nouveau fournisseur
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nom du fournisseur *"
                    placeholder="Nom du fournisseur"
                    value={newFournisseurName}
                    onChange={(e) => {
                      setNewFournisseurName(e.target.value)
                      // Use a fake id for new supplier; we'll create it inline
                      setValue('fournisseurId', 'new')
                    }}
                    error={
                      !newFournisseurName.trim() && errors.fournisseurId
                        ? 'Nom du fournisseur requis'
                        : undefined
                    }
                  />
                  <Input
                    label="Téléphone"
                    placeholder="Téléphone"
                    value={newFournisseurTel}
                    onChange={(e) => setNewFournisseurTel(e.target.value)}
                  />
                </div>
                <Input
                  label="Wilaya"
                  placeholder="Wilaya"
                  value={newFournisseurWilaya}
                  onChange={(e) => setNewFournisseurWilaya(e.target.value)}
                />
                <button
                  type="button"
                  className="text-xs text-alu-sub hover:text-alu-text transition-colors"
                  onClick={() => {
                    setNewFournisseurMode(false)
                    setNewFournisseurName('')
                    setNewFournisseurTel('')
                    setNewFournisseurWilaya('')
                    setValue('fournisseurId', '')
                  }}
                >
                  ← Choisir un fournisseur existant
                </button>
              </div>
            )}

            <Input
              label="Date d'achat *"
              type="date"
              {...register('dateAchat')}
              error={errors.dateAchat?.message}
            />

            <Textarea
              label="Notes"
              placeholder="Notes facultatives..."
              rows={3}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lignes d&apos;achat</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  designation: '',
                  produitId: '',
                  quantite: 1,
                  prixUnitaire: 0,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter ligne
            </Button>
          </CardHeader>
          <CardContent>
            {errors.lignes?.root && (
              <p className="text-xs text-alu-danger mb-3">
                {errors.lignes.root.message}
              </p>
            )}

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-alu-border">
                    <th className="pb-2 pr-3 text-left text-xs font-medium text-alu-sub uppercase tracking-wider w-8">
                      #
                    </th>
                    <th className="pb-2 pr-3 text-left text-xs font-medium text-alu-sub uppercase tracking-wider">
                      Désignation
                    </th>
                    <th className="pb-2 pr-3 text-left text-xs font-medium text-alu-sub uppercase tracking-wider w-48">
                      Produit
                    </th>
                    <th className="pb-2 pr-3 text-right text-xs font-medium text-alu-sub uppercase tracking-wider w-24">
                      Quantité
                    </th>
                    <th className="pb-2 pr-3 text-right text-xs font-medium text-alu-sub uppercase tracking-wider w-32">
                      Prix unitaire
                    </th>
                    <th className="pb-2 text-right text-xs font-medium text-alu-sub uppercase tracking-wider w-32">
                      Total
                    </th>
                    <th className="pb-2 pl-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-alu-border/50">
                  {fields.map((field, index) => {
                    const qte = Number(lignes?.[index]?.quantite) || 0
                    const pu = Number(lignes?.[index]?.prixUnitaire) || 0
                    const lineTotal = qte * pu
                    return (
                      <tr key={field.id}>
                        <td className="py-2 pr-3 text-alu-sub text-xs">
                          {index + 1}
                        </td>
                        <td className="py-2 pr-3">
                          <Input
                            placeholder="Désignation"
                            error={
                              errors.lignes?.[index]?.designation?.message
                            }
                            {...register(`lignes.${index}.designation`)}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            className="flex h-10 w-full appearance-none rounded-lg border border-alu-border bg-alu-bg px-3 py-2 pr-8 text-sm text-alu-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                            {...register(`lignes.${index}.produitId`)}
                            onChange={(e) =>
                              handleProduitSelect(e.target.value, index)
                            }
                          >
                            <option value="">-- Aucun --</option>
                            {produitOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="text-right tabular-nums"
                            error={
                              errors.lignes?.[index]?.quantite?.message
                            }
                            {...register(`lignes.${index}.quantite`, {
                              valueAsNumber: true,
                            })}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="text-right tabular-nums"
                            error={
                              errors.lignes?.[index]?.prixUnitaire?.message
                            }
                            {...register(`lignes.${index}.prixUnitaire`, {
                              valueAsNumber: true,
                            })}
                          />
                        </td>
                        <td className="py-2 text-right text-sm font-medium text-alu-text tabular-nums">
                          {formatMontant(lineTotal)}
                        </td>
                        <td className="py-2 pl-3">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-1.5 rounded-md text-alu-sub hover:text-alu-danger hover:bg-alu-danger/10 transition-colors"
                              aria-label={`Supprimer ligne ${index + 1}`}
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {fields.map((field, index) => {
                const qte = Number(lignes?.[index]?.quantite) || 0
                const pu = Number(lignes?.[index]?.prixUnitaire) || 0
                const lineTotal = qte * pu
                return (
                  <div
                    key={field.id}
                    className="rounded-lg border border-alu-border bg-alu-bg p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-alu-sub">
                        Ligne {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 rounded-md text-alu-sub hover:text-alu-danger hover:bg-alu-danger/10 transition-colors"
                          aria-label={`Supprimer ligne ${index + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <Input
                      placeholder="Désignation *"
                      error={errors.lignes?.[index]?.designation?.message}
                      {...register(`lignes.${index}.designation`)}
                    />

                    <select
                      className="flex h-10 w-full appearance-none rounded-lg border border-alu-border bg-alu-bg px-3 py-2 pr-8 text-sm text-alu-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent"
                      {...register(`lignes.${index}.produitId`)}
                      onChange={(e) =>
                        handleProduitSelect(e.target.value, index)
                      }
                    >
                      <option value="">-- Produit (optionnel) --</option>
                      {produitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Quantité"
                        type="number"
                        step="0.01"
                        min="0"
                        error={errors.lignes?.[index]?.quantite?.message}
                        {...register(`lignes.${index}.quantite`, {
                          valueAsNumber: true,
                        })}
                      />
                      <Input
                        label="Prix unitaire"
                        type="number"
                        step="0.01"
                        min="0"
                        error={errors.lignes?.[index]?.prixUnitaire?.message}
                        {...register(`lignes.${index}.prixUnitaire`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-alu-border/50">
                      <span className="text-sm font-semibold text-alu-text tabular-nums">
                        Total: {formatMontant(lineTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add line on mobile */}
            <div className="md:hidden mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  append({
                    designation: '',
                    produitId: '',
                    quantite: 1,
                    prixUnitaire: 0,
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter ligne
              </Button>
            </div>

            {/* Total */}
            <div className="flex items-center justify-end pt-4 mt-4 border-t border-alu-border">
              <div className="text-right">
                <p className="text-sm text-alu-sub">Total général</p>
                <p className="text-2xl font-bold text-alu-accent tabular-nums">
                  {formatMontant(totalGeneral)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/achats')}
            disabled={createAchat.isPending}
          >
            Annuler
          </Button>
          <Button type="submit" loading={createAchat.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </main>
  )
}