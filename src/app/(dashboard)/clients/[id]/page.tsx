'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import {
  ArrowLeft,
  Edit3,
  Phone,
  MapPin,
  FileText,
  Receipt,
  User,
  X,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/shared/StatCard'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useClient, useUpdateClient } from '@/hooks/useClients'
import { formatMontant, formatDate } from '@/lib/utils'
import type {
  Client,
  Devis,
  Facture,
  StatutDevis,
  StatutFacture,
} from '@/types'
import { cn } from '@/lib/utils'

type TabKey = 'devis' | 'factures'

export default function ClientDetailPage() {
  const router = useRouter()
  const { id } = router.query as { id: string }
  const [activeTab, setActiveTab] = useState<TabKey>('devis')
  const [editMode, setEditMode] = useState(false)

  const { data, isLoading, isError, error } = useClient(id)
  const updateClient = useUpdateClient()
  const client = data?.data as
    | (Client & { totalFacture?: number; totalPaye?: number; resteAPayer?: number; devis?: Devis[]; factures?: Facture[] })
    | undefined

  // Edit form state
  const [editNom, setEditNom] = useState('')
  const [editPrenom, setEditPrenom] = useState('')
  const [editTelephone, setEditTelephone] = useState('')
  const [editAdresse, setEditAdresse] = useState('')
  const [editWilaya, setEditWilaya] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const startEdit = () => {
    if (!client) return
    setEditNom(client.nom)
    setEditPrenom(client.prenom || '')
    setEditTelephone(client.telephone || '')
    setEditAdresse(client.adresse || '')
    setEditWilaya(client.wilaya || '')
    setEditNotes(client.notes || '')
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditMode(false)
  }

  const saveEdit = async () => {
    if (!id) return
    try {
      await updateClient.mutateAsync({
        id,
        payload: {
          nom: editNom,
          prenom: editPrenom || undefined,
          telephone: editTelephone || undefined,
          adresse: editAdresse || undefined,
          wilaya: editWilaya || undefined,
          notes: editNotes || undefined,
        },
      })
      setEditMode(false)
    } catch {
      // handled by react-query
    }
  }

  if (!id) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <PageHeader title="Client" />
        <p className="text-sm text-alu-sub mt-4">ID manquant.</p>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader title="Chargement..." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isError || !client) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Client"
          action={
            <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          }
        />
        <div className="rounded-xl border border-alu-danger/20 bg-alu-danger/5 p-6 text-center">
          <p className="text-sm text-alu-danger">
            {error?.message || 'Client introuvable.'}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/clients')}>
            Retour aux clients
          </Button>
        </div>
      </main>
    )
  }

  const clientFullName = client.prenom
    ? `${client.prenom} ${client.nom}`
    : client.nom

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'devis', label: 'Devis', icon: <FileText className="h-4 w-4" /> },
    { key: 'factures', label: 'Factures', icon: <Receipt className="h-4 w-4" /> },
  ]

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title={clientFullName}
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        }
      />

      {/* Client info card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-alu-sub" />
            Informations
          </CardTitle>
          {!editMode ? (
            <Button variant="ghost" size="sm" onClick={startEdit}>
              <Edit3 className="h-3.5 w-3.5" />
              Modifier
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                disabled={updateClient.isPending}
              >
                <X className="h-3.5 w-3.5" />
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                loading={updateClient.isPending}
              >
                <Check className="h-3.5 w-3.5" />
                Enregistrer
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom *"
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
              />
              <Input
                label="Prénom"
                value={editPrenom}
                onChange={(e) => setEditPrenom(e.target.value)}
              />
              <Input
                label="Téléphone"
                value={editTelephone}
                onChange={(e) => setEditTelephone(e.target.value)}
              />
              <Input
                label="Wilaya"
                value={editWilaya}
                onChange={(e) => setEditWilaya(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Adresse"
                  value={editAdresse}
                  onChange={(e) => setEditAdresse(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div>
                <span className="text-alu-sub">Nom complet</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {clientFullName}
                </p>
              </div>
              <div>
                <span className="text-alu-sub flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Téléphone
                </span>
                <p className="font-medium text-alu-text mt-0.5">
                  {client.telephone || '—'}
                </p>
              </div>
              <div>
                <span className="text-alu-sub flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Adresse
                </span>
                <p className="font-medium text-alu-text mt-0.5">
                  {client.adresse || '—'}
                </p>
              </div>
              <div>
                <span className="text-alu-sub">Wilaya</span>
                <p className="font-medium text-alu-text mt-0.5">
                  {client.wilaya || '—'}
                </p>
              </div>
              {client.notes && (
                <div className="sm:col-span-2">
                  <span className="text-alu-sub">Notes</span>
                  <p className="font-medium text-alu-text mt-0.5 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total facturé"
          value={formatMontant(client.totalFacture || 0)}
          colorClass="text-alu-accent"
        />
        <StatCard
          title="Total payé"
          value={formatMontant(client.totalPaye || 0)}
          colorClass="text-alu-success"
        />
        <StatCard
          title="Total impayé"
          value={formatMontant(client.resteAPayer || 0)}
          colorClass="text-alu-danger"
        />
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-alu-border px-4 sm:px-6">
          <div className="flex gap-0" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tab.key
                    ? 'border-alu-accent text-alu-accent'
                    : 'border-transparent text-alu-sub hover:text-alu-text hover:border-alu-border'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-0">
          {/* Devis tab */}
          {activeTab === 'devis' && (
            <DevisTab devis={client.devis || []} />
          )}
          {/* Factures tab */}
          {activeTab === 'factures' && (
            <FacturesTab factures={client.factures || []} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function DevisTab({ devis }: { devis: Devis[] }) {
  if (devis.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-8 w-8 text-alu-muted mx-auto mb-3" />
        <p className="text-sm text-alu-sub">Aucun devis pour ce client.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Référence</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Montant TTC</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devis.map((d) => (
          <TableRow
            key={d.id}
            className="cursor-pointer"
            onClick={() =>
              (window.location.href = `/devis/${d.id}`)
            }
          >
            <TableCell className="font-medium text-alu-accent">
              {d.reference}
            </TableCell>
            <TableCell className="text-sm text-alu-sub">
              {formatDate(d.dateDevis)}
            </TableCell>
            <TableCell className="text-right tabular-nums font-medium">
              {formatMontant(d.montantTTC)}
            </TableCell>
            <TableCell>
              <Badge variant={d.statut as StatutDevis} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function FacturesTab({ factures }: { factures: Facture[] }) {
  if (factures.length === 0) {
    return (
      <div className="py-12 text-center">
        <Receipt className="h-8 w-8 text-alu-muted mx-auto mb-3" />
        <p className="text-sm text-alu-sub">Aucune facture pour ce client.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Référence</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Montant TTC</TableHead>
          <TableHead className="hidden sm:table-cell text-right">Reste</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {factures.map((f) => (
          <TableRow
            key={f.id}
            className="cursor-pointer"
            onClick={() =>
              (window.location.href = `/factures/${f.id}`)
            }
          >
            <TableCell className="font-medium text-alu-accent">
              {f.reference}
            </TableCell>
            <TableCell className="text-sm text-alu-sub">
              {formatDate(f.dateFacture)}
            </TableCell>
            <TableCell className="text-right tabular-nums font-medium">
              {formatMontant(f.montantTTC)}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-right tabular-nums">
              <span
                className={
                  f.resteAPayer > 0 ? 'text-alu-danger font-medium' : 'text-alu-success'
                }
              >
                {formatMontant(f.resteAPayer)}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={f.statut as StatutFacture} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}