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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { devis: true, factures: true },
        },
        devis: {
          take: 5,
          orderBy: { dateDevis: 'desc' },
        },
        factures: {
          take: 5,
          orderBy: { dateFacture: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Aggregate totals
    const aggregates = await prisma.facture.aggregate({
      where: {
        clientId: id,
        statut: { not: 'ANNULEE' },
      },
      _sum: {
        montantTTC: true,
        montantPaye: true,
      },
    })

    const totalFacture = aggregates._sum.montantTTC || 0
    const totalPaye = aggregates._sum.montantPaye || 0

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        totalFacture,
        totalPaye,
        resteAPayer: Math.max(0, totalFacture - totalPaye),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get client error:', error)
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
    const { nom, prenom, telephone, adresse, wilaya, notes } = body

    const existing = await prisma.client.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        nom: nom !== undefined ? nom.trim() : undefined,
        prenom: prenom !== undefined ? prenom || null : undefined,
        telephone: telephone !== undefined ? telephone || null : undefined,
        adresse: adresse !== undefined ? adresse || null : undefined,
        wilaya: wilaya !== undefined ? wilaya || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: client,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update client error:', error)
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

    const existing = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { devis: true, factures: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    if (existing._count.devis > 0 || existing._count.factures > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer ce client car il a des devis ou factures associés',
        },
        { status: 409 }
      )
    }

    await prisma.client.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { message: 'Client supprimé avec succès' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
