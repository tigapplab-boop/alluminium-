'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Truck,
  Package,
  FileText,
  Receipt,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  { href: '/fournisseurs', label: 'Fournisseurs', icon: Truck },
  { href: '/produits', label: 'Produits', icon: Package },
  { href: '/devis', label: 'Devis', icon: FileText },
  { href: '/factures', label: 'Factures', icon: Receipt },
  { href: '/comptabilite', label: 'Comptabilité', icon: BarChart3 },
]

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const logout = useAuthStore((s) => s.logout)

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    onClose()
    logout()
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader>
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>
      <SheetBody>
        <nav aria-label="Navigation supplémentaire">
          <ul className="space-y-1" role="list">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-alu-accent/10 text-alu-accent'
                        : 'text-alu-sub hover:bg-alu-border/50 hover:text-alu-text'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </SheetBody>
      <SheetFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-alu-sub hover:text-alu-danger hover:bg-alu-danger/10 gap-3"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          Déconnexion
        </Button>
      </SheetFooter>
    </Sheet>
  )
}