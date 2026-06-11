import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, createAccessToken, createRefreshToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Nom d\'utilisateur et mot de passe requis' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { associe: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const accessToken = await createAccessToken({ userId: user.id, role: user.role })
    const refreshToken = await createRefreshToken({ userId: user.id })

    // Store refresh token hash in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
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
        },
      },
      timestamp: new Date().toISOString(),
    })

    // Set access token in httpOnly cookie for middleware
    response.cookies.set('access_token', accessToken, {
      httpOnly: false, // Allow JS to read for client-side store
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    // Set refresh token in httpOnly cookie
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
