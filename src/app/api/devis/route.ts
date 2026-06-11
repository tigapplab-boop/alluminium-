import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut') || ''
    const clientId = searchParams.get('clientId') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (statut && ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'CONVERTI'].includes(statut)) {
      where.statut = statut
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (from || to) {
      where.dateDevis = {}
      if (from) {
        (where.dateDevis as Record<string, unknown>).gte = new Date(from)
      }
      if (to) {
        (where.dateDevis as Record<string, unknown>).lte = new Date(to)
      }
    }

    const [devis, total] = await Promise.all([
      prisma.devis.findMany({
        where,
        include: {
          client: true,
          _count: { select: { lignes: true, factures: true } },
        },
        orderBy: { dateDevis: 'desc' },
        skip,
        take: limit,
      }),
      prisma.devis.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: devis,
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
    console.error('List devis error:', error)
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
    const { clientId, dateDevis, dateValidite, tva, notes, lignes } = body

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Le client est requis' },
        { status: 400 }
      )
    }

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Au moins une ligne de devis est requise' },
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
      // Generate reference: DEV-YYYY-NNNN
      const year = new Date().getFullYear()
      const yearPrefix = `DEV-${year}-`
      const lastDevis = await tx.devis.findFirst({
        where: { reference: { startsWith: yearPrefix } },
        orderBy: { reference: 'desc' },
        select: { reference: true },
      })

      let nextNum = 1
      if (lastDevis) {
        const lastNum = parseInt(lastDevis.reference.split('-').pop() || '0', 10)
        nextNum = lastNum + 1
      }
      const reference = `${yearPrefix}${String(nextNum).padStart(4, '0')}`

      // Calculate line totals
      const processedLines = lignes.map((line: Record<string, unknown>, index: number) => ({
        designation: line.designation as string,
        description: (line.description as string) || null,
        unite: (line.unite as string) || 'unité',
        quantite: line.quantite as number,
        prixUnitaire: line.prixUnitaire as number,
        montantTotal: (line.quantite as number) * (line.prixUnitaire as number),
        ordre: line.ordre !== undefined ? (line.ordre as number) : index,
      }))

      const montantHT = processedLines.reduce((sum: number, l: { montantTotal: number }) => sum + l.montantTotal, 0)
      const tvaValue = tva ?? 0
      const montantTTC = montantHT * (1 + tvaValue / 100)

      // Create devis with lines
      const devis = await tx.devis.create({
        data: {
          reference,
          clientId,
          dateDevis: dateDevis ? new Date(dateDevis) : new Date(),
          dateValidite: dateValidite ? new Date(dateValidite) : null,
          montantHT,
          tva: tvaValue,
          montantTTC,
          statut: 'BROUILLON',
          notes: notes || null,
          lignes: {
            create: processedLines,
          },
        },
        include: {
          client: true,
          lignes: true,
        },
      })

      return devis
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
    console.error('Create devis error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
