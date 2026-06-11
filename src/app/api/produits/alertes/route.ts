import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'

export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const alertes = await prisma.produit.findMany({
      where: {
        stockActuel: { lt: 0 },
      },
      include: { fournisseur: true },
      orderBy: { stockActuel: 'asc' },
    })

    // Filter where stockActuel < stockMinimum
    const filtered = alertes.filter((p) => p.stockActuel < p.stockMinimum)

    return NextResponse.json({
      success: true,
      data: filtered,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Alertes produits error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
