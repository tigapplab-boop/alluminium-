'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Achat,
  PaiementAchat,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export function useAchats(params?: {
  page?: number
  limit?: number
  search?: string
  statut?: string
  fournisseurId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery<PaginatedResponse<Achat>>({
    queryKey: ['achats', params],
    queryFn: async () => {
      const { data } = await api.get('/achats', { params })
      return data
    },
  })
}

export function useAchat(id: string) {
  return useQuery<ApiResponse<Achat>>({
    queryKey: ['achats', id],
    queryFn: async () => {
      const { data } = await api.get(`/achats/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useAchatPaiements(id: string) {
  return useQuery<ApiResponse<PaiementAchat[]>>({
    queryKey: ['achats', id, 'paiements'],
    queryFn: async () => {
      const { data } = await api.get(`/achats/${id}/paiements`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateAchat() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Achat>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/achats', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achats'] })
      queryClient.invalidateQueries({ queryKey: ['caisse'] })
      queryClient.invalidateQueries({ queryKey: ['produits'] })
    },
  })
}

export function useAddPaiementAchat() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<PaiementAchat>, Error, { id: string; payload: Record<string, unknown> }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.post(`/achats/${id}/paiements`, payload)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['achats', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['achats', variables.id, 'paiements'] })
      queryClient.invalidateQueries({ queryKey: ['achats'] })
      queryClient.invalidateQueries({ queryKey: ['caisse'] })
    },
  })
}