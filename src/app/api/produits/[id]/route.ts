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

    const produit = await prisma.produit.findUnique({
      where: { id },
      include: {
        fournisseur: true,
        lignesAchat: {
          include: {
            achat: {
              include: { fournisseur: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!produit) {
      return NextResponse.json(
        { success: false, error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: produit,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get produit error:', error)
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
    const {
      designation,
      reference,
      typeProduit,
      unite,
      prixUnitaire,
      stockActuel,
      stockMinimum,
      fournisseurId,
    } = body

    const existing = await prisma.produit.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const produit = await prisma.produit.update({
      where: { id },
      data: {
        designation: designation !== undefined ? designation.trim() : undefined,
        reference: reference !== undefined ? reference || null : undefined,
        typeProduit: typeProduit !== undefined ? typeProduit : undefined,
        unite: unite !== undefined ? unite : undefined,
        prixUnitaire: prixUnitaire !== undefined ? prixUnitaire : undefined,
        stockActuel: stockActuel !== undefined ? stockActuel : undefined,
        stockMinimum: stockMinimum !== undefined ? stockMinimum : undefined,
        fournisseurId: fournisseurId !== undefined ? fournisseurId || null : undefined,
      },
      include: { fournisseur: true },
    })

    return NextResponse.json({
      success: true,
      data: produit,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update produit error:', error)
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

    const existing = await prisma.produit.findUnique({
      where: { id },
      include: { _count: { select: { lignesAchat: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    if (existing._count.lignesAchat > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer ce produit car il est lié à des lignes d\'achat',
        },
        { status: 409 }
      )
    }

    await prisma.produit.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { message: 'Produit supprimé avec succès' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Delete produit error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
