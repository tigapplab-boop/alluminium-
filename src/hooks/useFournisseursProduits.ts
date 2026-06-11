'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import type { Fournisseur, Produit, ApiResponse } from '@/types'

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }))
    throw new Error(err.error || 'Erreur réseau')
  }
  return res.json()
}

export function useFournisseurs(search?: string) {
  const token = useAuthStore((s) => s.accessToken)!

  const qp = new URLSearchParams()
  if (search) qp.set('search', search)

  return useQuery<ApiResponse<Fournisseur[]>>({
    queryKey: ['fournisseurs', search],
    queryFn: () => fetcher(`/api/fournisseurs?${qp.toString()}`, token),
    enabled: !!token,
  })
}

export function useProduits(search?: string) {
  const token = useAuthStore((s) => s.accessToken)!

  const qp = new URLSearchParams()
  if (search) qp.set('search', search)

  return useQuery<ApiResponse<Produit[]>>({
    queryKey: ['produits', search],
    queryFn: () => fetcher(`/api/produits?${qp.toString()}`, token),
    enabled: !!token,
  })
}