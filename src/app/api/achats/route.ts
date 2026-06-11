import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut') || ''
    const fournisseurId = searchParams.get('fournisseurId') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (statut && ['NON_PAYE', 'PARTIELLEMENT_PAYE', 'PAYE'].includes(statut)) {
      where.statut = statut
    }

    if (fournisseurId) {
      where.fournisseurId = fournisseurId
    }

    if (from || to) {
      where.dateAchat = {}
      if (from) {
        (where.dateAchat as Record<string, unknown>).gte = new Date(from)
      }
      if (to) {
        (where.dateAchat as Record<string, unknown>).lte = new Date(to)
      }
    }

    const [achats, total] = await Promise.all([
      prisma.achat.findMany({
        where,
        include: {
          fournisseur: true,
          _count: { select: { lignes: true, paiements: true } },
        },
        orderBy: { dateAchat: 'desc' },
        skip,
        take: limit,
      }),
      prisma.achat.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: achats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List achats error:', error)
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

    const body = await request.json()
    const { fournisseurId, dateAchat, notes, lignes } = body

    if (!fournisseurId) {
      return NextResponse.json(
        { success: false, error: 'Le fournisseur est requis' },
        { status: 400 }
      )
    }

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Au moins une ligne d\'achat est requise' },
        { status: 400 }
      )
    }

    // Validate each line
    for (const line of lignes) {
      if (!line.designation || typeof line.quantite !== 'number' || typeof line.prixUnitaire !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Chaque ligne doit avoir une désignation, une quantité et un prix unitaire valides' },
          { status: 400 }
        )
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generate reference: ACH-YYYY-NNNN
      const year = new Date().getFullYear()
      const yearPrefix = `ACH-${year}-`
      const lastAchat = await tx.achat.findFirst({
        where: { reference: { startsWith: yearPrefix } },
        orderBy: { reference: 'desc' },
        select: { reference: true },
      })

      let nextNum = 1
      if (lastAchat) {
        const lastNum = parseInt(lastAchat.reference.split('-').pop() || '0', 10)
        nextNum = lastNum + 1
      }
      const reference = `${yearPrefix}${String(nextNum).padStart(4, '0')}`

      // Calculate totals for each line
      const processedLines = lignes.map((line: Record<string, unknown>) => ({
        designation: line.designation as string,
        produitId: (line.produitId as string) || null,
        quantite: line.quantite as number,
        prixUnitaire: line.prixUnitaire as number,
        montantTotal: (line.quantite as number) * (line.prixUnitaire as number),
      }))

      const montantTotal = processedLines.reduce((sum: number, l: { montantTotal: number }) => sum + l.montantTotal, 0)

      // Create achat with lines
      const achat = await tx.achat.create({
        data: {
          reference,
          fournisseurId,
          dateAchat: dateAchat ? new Date(dateAchat) : new Date(),
          montantTotal,
          montantPaye: 0,
          resteAPayer: montantTotal,
          statut: 'NON_PAYE',
          notes: notes || null,
          lignes: {
            create: processedLines,
          },
        },
        include: {
          fournisseur: true,
          lignes: true,
        },
      })

      // Update stock for products
      for (const line of lignes) {
        if (line.produitId) {
          await tx.produit.update({
            where: { id: line.produitId as string },
            data: { stockActuel: { increment: line.quantite as number } },
          })
        }
      }

      return achat
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create achat error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
