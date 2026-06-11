'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  onMenuOpen: () => void
}

const mainItems = [
  { href: '/', label: 'Accueil', icon: LayoutDashboard },
  { href: '/achats', label: 'Achats', icon: ShoppingCart },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/caisse', label: 'Caisse', icon: Wallet },
]

export function BottomNav({ onMenuOpen }: BottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around bg-alu-surface border-t border-alu-border lg:hidden"
      aria-label="Navigation mobile"
    >
      {mainItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]',
              active
                ? 'text-alu-accent'
                : 'text-alu-sub hover:text-alu-text'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-tight">
              {item.label}
            </span>
          </Link>
        )
      })}
      <button
        onClick={onMenuOpen}
        className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-alu-sub hover:text-alu-text transition-colors min-w-[60px]"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="text-[10px] font-medium leading-tight">Menu</span>
      </button>
    </nav>
  )
}