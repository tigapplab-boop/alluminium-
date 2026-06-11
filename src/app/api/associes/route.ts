import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, requireAdmin } from '@/lib/authMiddleware'

export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const associes = await prisma.associe.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        _count: {
          select: { retraits: true },
        },
        retraits: {
          select: { montant: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate totalRetire per associe
    const data = associes.map((a) => ({
      ...a,
      totalRetire: a.retraits.reduce((sum: number, r: { montant: number }) => sum + r.montant, 0),
    }))

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List associes error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const adminError = requireAdmin(user!)
    if (adminError) return adminError

    const body = await request.json()
    const { nom, prenom, telephone, partPct } = body

    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    if (!prenom || typeof prenom !== 'string' || prenom.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le prénom est requis' },
        { status: 400 }
      )
    }

    if (typeof partPct !== 'number' || partPct < 0 || partPct > 100) {
      return NextResponse.json(
        { success: false, error: 'La part doit être un nombre entre 0 et 100' },
        { status: 400 }
      )
    }

    const associe = await prisma.associe.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone || null,
        partPct,
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

    return NextResponse.json(
      {
        success: true,
        data: associe,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create associe error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
