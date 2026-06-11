'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Associe,
  ApiResponse,
} from '@/types'

export function useAssocies() {
  return useQuery<ApiResponse<Associe[]>>({
    queryKey: ['associes'],
    queryFn: async () => {
      const { data } = await api.get('/associes')
      return data
    },
  })
}

export function useAssocie(id: string) {
  return useQuery<ApiResponse<Associe>>({
    queryKey: ['associes', id],
    queryFn: async () => {
      const { data } = await api.get(`/associes/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateAssocie() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Associe>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/associes', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associes'] })
    },
  })
}