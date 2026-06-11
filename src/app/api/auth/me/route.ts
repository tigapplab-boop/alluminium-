import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: { associe: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        associeId: user.associeId,
        associe: user.associe ? {
          id: user.associe.id,
          nom: user.associe.nom,
          prenom: user.associe.prenom,
          telephone: user.associe.telephone,
          partPct: user.associe.partPct,
        } : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
