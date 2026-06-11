'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Facture,
  PaiementFacture,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export function useFactures(params?: {
  page?: number
  limit?: number
  search?: string
  statut?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery<PaginatedResponse<Facture>>({
    queryKey: ['factures', params],
    queryFn: async () => {
      const { data } = await api.get('/factures', { params })
      return data
    },
  })
}

export function useFacture(id: string) {
  return useQuery<ApiResponse<Facture>>({
    queryKey: ['factures', id],
    queryFn: async () => {
      const { data } = await api.get(`/factures/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useFacturePaiements(id: string) {
  return useQuery<ApiResponse<PaiementFacture[]>>({
    queryKey: ['factures', id, 'paiements'],
    queryFn: async () => {
      const { data } = await api.get(`/factures/${id}/paiements`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateFacture() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Facture>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/factures', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['caisse'] })
    },
  })
}

export function useAddPaiementFacture() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<PaiementFacture>, Error, { id: string; payload: Record<string, unknown> }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.post(`/factures/${id}/paiements`, payload)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['factures', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['factures', variables.id, 'paiements'] })
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['caisse'] })
    },
  })
}

export function useAnnulerFacture() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Facture>, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/factures/${id}/annuler`)
      return data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['factures', id] })
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    },
  })
}