import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    // Verify associe exists
    const associe = await prisma.associe.findUnique({ where: { id } })
    if (!associe) {
      return NextResponse.json(
        { success: false, error: 'Associé non trouvé' },
        { status: 404 }
      )
    }

    const [retraits, total] = await Promise.all([
      prisma.retraitCaisse.findMany({
        where: { associeId: id },
        orderBy: { dateRetrait: 'desc' },
        skip,
        take: limit,
      }),
      prisma.retraitCaisse.count({ where: { associeId: id } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: retraits,
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
    console.error('List retraits associe error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
