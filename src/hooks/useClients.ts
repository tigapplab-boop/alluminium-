'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Client,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export function useClients(search?: string) {
  return useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', search],
    queryFn: async () => {
      const { data } = await api.get('/clients', { params: search ? { search } : undefined })
      return data
    },
  })
}

export function useClient(id: string) {
  return useQuery<ApiResponse<Client>>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Client>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/clients', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Client>, Error, { id: string; payload: Record<string, unknown> }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/clients/${id}`, payload)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}