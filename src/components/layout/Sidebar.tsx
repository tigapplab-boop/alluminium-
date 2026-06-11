'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  Truck,
  Package,
  FileText,
  Receipt,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/achats', label: 'Achats', icon: ShoppingCart },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/caisse', label: 'Caisse', icon: Wallet },
  { href: '/fournisseurs', label: 'Fournisseurs', icon: Truck },
  { href: '/produits', label: 'Produits', icon: Package },
  { href: '/devis', label: 'Devis', icon: FileText },
  { href: '/factures', label: 'Factures', icon: Receipt },
  { href: '/comptabilite', label: 'Comptabilité', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const logout = useAuthStore((s) => s.logout)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:z-40">
      <div className="flex h-full flex-col bg-alu-surface border-r border-alu-border">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-alu-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-alu-accent/10">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-alu-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold text-alu-text">
              AluAtelier
            </span>
            <span className="ml-1 text-xs font-medium text-alu-accent">Pro</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Navigation principale">
          <ul className="space-y-1" role="list">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-alu-accent/10 text-alu-accent'
                        : 'text-alu-sub hover:bg-alu-border/50 hover:text-alu-text'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-alu-border p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-alu-sub hover:bg-alu-danger/10 hover:text-alu-danger transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  )
}