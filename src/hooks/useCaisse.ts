'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  SoldeCaisse,
  TransactionCaisse,
  RetraitCaisse,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export function useSoldeCaisse() {
  return useQuery<ApiResponse<SoldeCaisse>>({
    queryKey: ['caisse', 'solde'],
    queryFn: async () => {
      const { data } = await api.get('/caisse/solde')
      return data
    },
  })
}

export function useTransactions(params?: {
  page?: number
  limit?: number
  type?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery<PaginatedResponse<TransactionCaisse>>({
    queryKey: ['caisse', 'transactions', params],
    queryFn: async () => {
      const { data } = await api.get('/caisse/transactions', { params })
      return data
    },
  })
}

export function useRetraits(params?: {
  page?: number
  limit?: number
}) {
  return useQuery<PaginatedResponse<RetraitCaisse>>({
    queryKey: ['caisse', 'retraits', params],
    queryFn: async () => {
      const { data } = await api.get('/caisse/retraits', { params })
      return data
    },
  })
}

export function useCreateRetrait() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<RetraitCaisse>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/caisse/retraits', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caisse'] })
    },
  })
}

export function useCreateAjustement() {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<TransactionCaisse>, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/caisse/ajustement', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caisse'] })
    },
  })
}