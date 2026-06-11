import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'

export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    // Calculate last 12 months
    const now = new Date()
    const months: Array<{
      mois: string
      achats: number
      recettes: number
      benefice: number
    }> = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

      const monthLabel = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
      })

      // Achats total for this month
      const achatsAgg = await prisma.achat.aggregate({
        where: {
          dateAchat: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { montantTotal: true },
      })

      // Recettes (paiements factures) for this month
      const recettesAgg = await prisma.paiementFacture.aggregate({
        where: {
          datePaiement: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { montant: true },
      })

      const achats = achatsAgg._sum.montantTotal || 0
      const recettes = recettesAgg._sum.montant || 0

      months.push({
        mois: monthLabel,
        achats,
        recettes,
        benefice: recettes - achats,
      })
    }

    return NextResponse.json({
      success: true,
      data: months,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Mensuel comptabilite error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
