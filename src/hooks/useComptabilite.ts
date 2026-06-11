'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  DashboardKPI,
  Bilan,
  MensuelData,
  ApiResponse,
} from '@/types'

export function useDashboard() {
  return useQuery<ApiResponse<DashboardKPI>>({
    queryKey: ['comptabilite', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/comptabilite/dashboard')
      return data
    },
  })
}

export function useBilan(from: string, to: string) {
  return useQuery<ApiResponse<Bilan>>({
    queryKey: ['comptabilite', 'bilan', from, to],
    queryFn: async () => {
      const { data } = await api.get('/comptabilite/bilan', { params: { from, to } })
      return data
    },
    enabled: !!from && !!to,
  })
}

export function useMensuel() {
  return useQuery<ApiResponse<MensuelData[]>>({
    queryKey: ['comptabilite', 'mensuel'],
    queryFn: async () => {
      const { data } = await api.get('/comptabilite/mensuel')
      return data
    },
  })
}