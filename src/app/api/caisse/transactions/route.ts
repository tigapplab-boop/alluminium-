import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (type && ['ENTREE', 'SORTIE', 'RETRAIT', 'AJUSTEMENT'].includes(type)) {
      where.type = type
    }

    if (from || to) {
      where.dateTransaction = {}
      if (from) {
        (where.dateTransaction as Record<string, unknown>).gte = new Date(from)
      }
      if (to) {
        (where.dateTransaction as Record<string, unknown>).lte = new Date(to)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transactionCaisse.findMany({
        where,
        orderBy: { dateTransaction: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transactionCaisse.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List transactions caisse error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
