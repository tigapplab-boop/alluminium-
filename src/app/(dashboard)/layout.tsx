'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import type { User } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, setUser, setAccessToken, accessToken } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // If we already have a user in store, no need to check
      if (user) {
        setChecking(false)
        return
      }

      // Try to fetch /auth/me
      try {
        const res = await api.get('/auth/me')
        if (res.data.success && res.data.data) {
          setUser(res.data.data as User)
        } else {
          router.replace('/login')
        }
      } catch {
        router.replace('/login')
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [user, setUser, setAccessToken, accessToken, router])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-alu-bg">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-10 w-10 animate-spin text-alu-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-alu-sub">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <Header />

      {/* Content area */}
      <div className="lg:ml-[240px] min-h-screen pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav onMenuOpen={() => setMenuOpen(true)} />

      {/* Mobile Menu Sheet */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}