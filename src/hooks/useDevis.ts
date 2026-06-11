'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Devis,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export function useDevis(params?: {
  page?: number
  limit?: number
  search?: string
  statut?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery<PaginatedResponse<Devis>>({
    queryKey: ['devis', params],
    queryFn: async () => {
      const { data } = await api.get('/devis', { params })
      return data
    },
  })
}

export function useDevisById(id: string) {
  return useQuery<ApiResponse<Devis>>({
    queryKey: ['devis', id],
    queryFn: async () => {
      const { data } = await api.get(`/devis/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateDevis() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Devis>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/devis', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis'] })
    },
  })
}

export function useUpdateStatutDevis() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Devis>, Error, { id: string; statut: string }>({
    mutationFn: async ({ id, statut }) => {
      const { data } = await api.patch(`/devis/${id}/statut`, { statut })
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devis', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['devis'] })
    },
  })
}

export function useConvertirDevis() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<unknown>, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/devis/${id}/convertir`)
      return data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['devis', id] })
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    },
  })
}