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

    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id },
      include: {
        _count: {
          select: { achats: true, produits: true },
        },
        achats: {
          take: 10,
          orderBy: { dateAchat: 'desc' },
          include: {
            lignes: true,
          },
        },
      },
    })

    if (!fournisseur) {
      return NextResponse.json(
        { success: false, error: 'Fournisseur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: fournisseur,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get fournisseur error:', error)
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

    const { id } = await params
    const body = await request.json()
    const { nom, telephone, adresse, wilaya, notes } = body

    const existing = await prisma.fournisseur.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Fournisseur non trouvé' },
        { status: 404 }
      )
    }

    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data: {
        nom: nom !== undefined ? nom.trim() : undefined,
        telephone: telephone !== undefined ? telephone || null : undefined,
        adresse: adresse !== undefined ? adresse || null : undefined,
        wilaya: wilaya !== undefined ? wilaya || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: fournisseur,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update fournisseur error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const { id } = await params

    const existing = await prisma.fournisseur.findUnique({
      where: { id },
      include: { _count: { select: { achats: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Fournisseur non trouvé' },
        { status: 404 }
      )
    }

    if (existing._count.achats > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer ce fournisseur car il a des achats associés',
        },
        { status: 409 }
      )
    }

    await prisma.fournisseur.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { message: 'Fournisseur supprimé avec succès' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Delete fournisseur error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
