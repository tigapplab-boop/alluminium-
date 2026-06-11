import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const { id } = await params

    const existing = await prisma.facture.findUnique({
      where: { id },
      include: { _count: { select: { paiements: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      )
    }

    if (existing._count.paiements > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible d\'annuler une facture ayant des paiements' },
        { status: 400 }
      )
    }

    if (existing.statut === 'ANNULEE') {
      return NextResponse.json(
        { success: false, error: 'Cette facture est déjà annulée' },
        { status: 400 }
      )
    }

    const updated = await prisma.facture.update({
      where: { id },
      data: { statut: 'ANNULEE' },
      include: {
        client: true,
        lignes: { orderBy: { ordre: 'asc' } },
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Annuler facture error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
