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

    const facture = await prisma.facture.findUnique({
      where: { id },
      include: {
        lignes: {
          orderBy: { ordre: 'asc' },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
        },
        client: true,
        devis: true,
      },
    })

    if (!facture) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: facture,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get facture error:', error)
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
    const { clientId, dateFacture, dateEcheance, tva, notes, lignes } = body

    const existing = await prisma.facture.findUnique({
      where: { id },
      include: { lignes: true },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      )
    }

    if (existing.statut === 'PAYEE' || existing.statut === 'ANNULEE') {
      return NextResponse.json(
        { success: false, error: `Impossible de modifier une facture avec le statut ${existing.statut}` },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // If lines are provided, recalculate everything
      if (lignes && Array.isArray(lignes)) {
        // Delete old lines
        await tx.ligneFacture.deleteMany({ where: { factureId: id } })

        // Create new lines
        const processedLines = lignes.map((line: Record<string, unknown>, index: number) => ({
          designation: line.designation as string,
          description: (line.description as string) || null,
          unite: (line.unite as string) || 'unité',
          quantite: line.quantite as number,
          prixUnitaire: line.prixUnitaire as number,
          montantTotal: (line.quantite as number) * (line.prixUnitaire as number),
          ordre: line.ordre !== undefined ? (line.ordre as number) : index,
        }))

        const newMontantHT = processedLines.reduce((sum: number, l: { montantTotal: number }) => sum + l.montantTotal, 0)
        const tvaValue = tva ?? existing.tva
        const newMontantTTC = newMontantHT * (1 + tvaValue / 100)
        const newResteAPayer = Math.max(0, newMontantTTC - existing.montantPaye)

        let newStatut: string = 'EN_ATTENTE'
        if (newResteAPayer <= 0) {
          newStatut = 'PAYEE'
        } else if (existing.montantPaye > 0) {
          newStatut = 'PARTIELLEMENT_PAYEE'
        }

        const updated = await tx.facture.update({
          where: { id },
          data: {
            clientId: clientId || existing.clientId,
            dateFacture: dateFacture ? new Date(dateFacture) : existing.dateFacture,
            dateEcheance: dateEcheance ? new Date(dateEcheance) : existing.dateEcheance,
            tva: tvaValue,
            montantHT: newMontantHT,
            montantTTC: newMontantTTC,
            resteAPayer: newResteAPayer,
            statut: newStatut,
            notes: notes !== undefined ? notes || null : existing.notes,
            lignes: {
              create: processedLines,
            },
          },
          include: {
            client: true,
            lignes: { orderBy: { ordre: 'asc' } },
            paiements: true,
          },
        })

        return updated
      } else {
        // Just update basic fields
        const tvaValue = tva !== undefined ? tva : existing.tva

        const updated = await tx.facture.update({
          where: { id },
          data: {
            clientId: clientId || undefined,
            dateFacture: dateFacture ? new Date(dateFacture) : undefined,
            dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
            tva: tva !== undefined ? tvaValue : undefined,
            notes: notes !== undefined ? notes || null : undefined,
          },
          include: {
            client: true,
            lignes: { orderBy: { ordre: 'asc' } },
            paiements: true,
          },
        })

        return updated
      }
    })

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update facture error:', error)
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

    const existing = await prisma.facture.findUnique({
      where: { id },
      include: { _count: { select: { paiements: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Facture non trouvée' },
        { status: 404 }
      )
    }

    if (existing._count.paiements > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer une facture ayant des paiements' },
        { status: 403 }
      )
    }

    await prisma.facture.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { message: 'Facture supprimée avec succès' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Delete facture error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
