import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, requireAdmin } from '@/lib/authMiddleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { id } = await params

    const associe = await prisma.associe.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        retraits: {
          orderBy: { dateRetrait: 'desc' },
        },
      },
    })

    if (!associe) {
      return NextResponse.json(
        { success: false, error: 'Associé non trouvé' },
        { status: 404 }
      )
    }

    const totalRetire = associe.retraits.reduce((sum, r) => sum + r.montant, 0)

    return NextResponse.json({
      success: true,
      data: {
        ...associe,
        totalRetire,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get associe error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const adminError = requireAdmin(user!)
    if (adminError) return adminError

    const { id } = await params
    const body = await request.json()
    const { nom, prenom, telephone, partPct } = body

    const existing = await prisma.associe.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Associé non trouvé' },
        { status: 404 }
      )
    }

    if (partPct !== undefined && (typeof partPct !== 'number' || partPct < 0 || partPct > 100)) {
      return NextResponse.json(
        { success: false, error: 'La part doit être un nombre entre 0 et 100' },
        { status: 400 }
      )
    }

    const associe = await prisma.associe.update({
      where: { id },
      data: {
        nom: nom !== undefined ? nom.trim() : undefined,
        prenom: prenom !== undefined ? prenom.trim() : undefined,
        telephone: telephone !== undefined ? telephone || null : undefined,
        partPct: partPct !== undefined ? partPct : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: associe,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update associe error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
