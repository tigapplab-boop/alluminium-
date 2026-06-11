import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    // Get or create the caisse row
    const caisse = await prisma.caisse.upsert({
      where: { id: 'default-caisse' },
      update: {},
      create: { id: 'default-caisse', solde: 0 },
    })

    // Calculate current month totals
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthTransactions = await prisma.transactionCaisse.aggregate({
      where: {
        dateTransaction: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        montant: true,
      },
    })

    const entrees = await prisma.transactionCaisse.aggregate({
      where: {
        type: 'ENTREE',
        dateTransaction: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { montant: true },
    })

    const sorties = await prisma.transactionCaisse.aggregate({
      where: {
        type: 'SORTIE',
        dateTransaction: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { montant: true },
    })

    const retraits = await prisma.transactionCaisse.aggregate({
      where: {
        type: 'RETRAIT',
        dateTransaction: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { montant: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        solde: caisse.solde,
        moisEnCours: {
          entrees: entrees._sum.montant || 0,
          sorties: sorties._sum.montant || 0,
          retraits: retraits._sum.montant || 0,
          totalTransactions: monthTransactions._sum.montant || 0,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get solde caisse error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
