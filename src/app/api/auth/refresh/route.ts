import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, createAccessToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Token de rafraîchissement manquant' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token de rafraîchissement invalide ou expiré' },
        { status: 401 }
      )
    }

    // Verify the refresh token is still stored in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string, refreshToken },
      include: { associe: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token de rafraîchissement invalide' },
        { status: 401 }
      )
    }

    const accessToken = await createAccessToken({ userId: user.id, role: user.role })

    return NextResponse.json({
      success: true,
      data: { accessToken },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
