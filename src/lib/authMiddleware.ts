import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import prisma from './prisma'

export async function authenticate(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 }), user: null }
    }
    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    if (!payload) {
      return { error: NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 }), user: null }
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: { associe: true },
    })
    if (!user) {
      return { error: NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 401 }), user: null }
    }
    return { error: null, user }
  } catch {
    return { error: NextResponse.json({ success: false, error: 'Erreur d\'authentification' }, { status: 401 }), user: null }
  }
}

export function requireAdmin(user: { role: string }) {
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Accès refusé. Droits administrateur requis.' }, { status: 403 })
  }
  return null
}
