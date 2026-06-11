'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { useClients, useCreateClient } from '@/hooks/useClients'
import { formatMontant } from '@/lib/utils'
import type { Client } from '@/types'

const clientSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  wilaya: z.string().optional(),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:border-alu-accent/40 transition-colors duration-200 group"
      onClick={onClick}
      role="link"
      tabIndex={0}
      aria-label={`Voir le client ${client.nom}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-alu-text truncate">
              {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
            </p>
            {client.telephone && (
              <p className="text-xs text-alu-sub mt-0.5">{client.telephone}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              {client._count?.factures !== undefined && (
                <Badge variant="EN_ATTENTE">
                  {client._count.factures} facture{client._count.factures > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {client.totalFacture !== undefined && client.totalFacture > 0 && (
              <p className="text-xs font-medium text-alu-accent tabular-nums">
                {formatMontant(client.totalFacture)}
              </p>
            )}
          </div>
        </div>

        {client.wilaya && (
          <p className="text-xs text-alu-muted mt-2">{client.wilaya}</p>
        )}

        <div className="flex items-center justify-end mt-3 pt-3 border-t border-alu-border/50">
          <span className="inline-flex items-center gap-1 text-xs text-alu-sub group-hover:text-alu-accent transition-colors">
            Voir détails
            <Plus className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ClientCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-alu-border animate-pulse" />
            <div className="h-3 w-24 rounded bg-alu-border animate-pulse" />
          </div>
          <div className="h-5 w-16 rounded-full bg-alu-border animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useClients(
    search || undefined
  )
  const createClient = useCreateClient()

  const clients = data?.data || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      wilaya: '',
      notes: '',
    },
  })

  const onCreateSubmit = async (formData: ClientFormData) => {
    try {
      await createClient.mutateAsync(formData)
      reset()
      setCreateOpen(false)
    } catch {
      // Error handled by react-query
    }
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Clients"
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Rechercher par nom ou téléphone..."
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 p-6 text-center">
          <p className="text-sm text-alu-danger">
            {error?.message || 'Une erreur est survenue.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 rounded-full bg-alu-border/50 p-4">
            <Users className="h-8 w-8 text-alu-muted" />
          </div>
          <h3 className="text-base font-semibold text-alu-text">
            {search ? 'Aucun résultat' : 'Aucun client'}
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-alu-sub">
            {search
              ? 'Aucun client ne correspond à votre recherche.'
              : 'Vous n\'avez pas encore enregistré de client. Commencez par créer votre premier client.'}
          </p>
          {!search && (
            <Button size="sm" className="mt-6" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouveau client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => router.push(`/clients/${client.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create client dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau client.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="create-client-form"
            onSubmit={handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom *"
                placeholder="Nom de famille"
                {...register('nom')}
                error={errors.nom?.message}
              />
              <Input
                label="Prénom"
                placeholder="Prénom"
                {...register('prenom')}
              />
            </div>
            <Input
              label="Téléphone"
              placeholder="Numéro de téléphone"
              {...register('telephone')}
            />
            <Input
              label="Adresse"
              placeholder="Adresse"
              {...register('adresse')}
            />
            <Input
              label="Wilaya"
              placeholder="Wilaya"
              {...register('wilaya')}
            />
            <Textarea
              label="Notes"
              placeholder="Notes facultatives..."
              rows={2}
              {...register('notes')}
            />
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setCreateOpen(false)}
            disabled={createClient.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="create-client-form"
            loading={createClient.isPending}
          >
            Créer le client
          </Button>
        </DialogFooter>
      </Dialog>
    </main>
  )
}