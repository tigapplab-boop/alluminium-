'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Fournisseur,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export function useFournisseurs(search?: string) {
  return useQuery<PaginatedResponse<Fournisseur>>({
    queryKey: ['fournisseurs', search],
    queryFn: async () => {
      const { data } = await api.get('/fournisseurs', { params: search ? { search } : undefined })
      return data
    },
  })
}

export function useFournisseur(id: string) {
  return useQuery<ApiResponse<Fournisseur>>({
    queryKey: ['fournisseurs', id],
    queryFn: async () => {
      const { data } = await api.get(`/fournisseurs/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateFournisseur() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Fournisseur>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/fournisseurs', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
    },
  })
}

export function useUpdateFournisseur() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Fournisseur>, Error, { id: string; payload: Record<string, unknown> }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/fournisseurs/${id}`, payload)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
    },
  })
}