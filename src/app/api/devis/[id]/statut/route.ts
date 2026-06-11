import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  BROUILLON: ['ENVOYE'],
  ENVOYE: ['ACCEPTE', 'REFUSE', 'BROUILLON'],
  ACCEPTE: ['CONVERTI'],
  REFUSE: ['BROUILLON'],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { statut } = body

    if (!statut || !['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'CONVERTI'].includes(statut)) {
      return NextResponse.json(
        { success: false, error: 'Statut invalide' },
        { status: 400 }
      )
    }

    const existing = await prisma.devis.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[existing.statut] || []
    if (!allowedTransitions.includes(statut)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transition de statut invalide. De "${existing.statut}" vers "${statut}" non autorisée. Transitions permises: ${allowedTransitions.join(', ') || 'aucune'}`,
        },
        { status: 400 }
      )
    }

    const updated = await prisma.devis.update({
      where: { id },
      data: { statut },
      include: { client: true, lignes: { orderBy: { ordre: 'asc' } } },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update devis statut error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
