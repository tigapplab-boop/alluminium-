'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Produit,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export function useProduits(params?: {
  page?: number
  limit?: number
  search?: string
  typeProduit?: string
  alerte?: boolean
}) {
  return useQuery<PaginatedResponse<Produit>>({
    queryKey: ['produits', params],
    queryFn: async () => {
      const { data } = await api.get('/produits', { params })
      return data
    },
  })
}

export function useProduit(id: string) {
  return useQuery<ApiResponse<Produit>>({
    queryKey: ['produits', id],
    queryFn: async () => {
      const { data } = await api.get(`/produits/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useProduitAlertes() {
  return useQuery<ApiResponse<Produit[]>>({
    queryKey: ['produits', 'alertes'],
    queryFn: async () => {
      const { data } = await api.get('/produits/alertes')
      return data
    },
  })
}

export function useCreateProduit() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Produit>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/produits', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
    },
  })
}

export function useUpdateProduit() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Produit>, Error, { id: string; payload: Record<string, unknown> }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/produits/${id}`, payload)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produits', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['produits', 'alertes'] })
    },
  })
}