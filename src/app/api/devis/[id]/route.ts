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

    const devis = await prisma.devis.findUnique({
      where: { id },
      include: {
        lignes: {
          orderBy: { ordre: 'asc' },
        },
        client: true,
        factures: {
          orderBy: { dateFacture: 'desc' },
        },
      },
    })

    if (!devis) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: devis,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get devis error:', error)
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
    const { clientId, dateDevis, dateValidite, tva, notes, lignes } = body

    const existing = await prisma.devis.findUnique({
      where: { id },
      include: { lignes: true },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    if (existing.statut === 'CONVERTI') {
      return NextResponse.json(
        { success: false, error: 'Impossible de modifier un devis déjà converti en facture' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // If lines are provided, recalculate everything
      if (lignes && Array.isArray(lignes)) {
        // Delete old lines
        await tx.ligneDevis.deleteMany({ where: { devisId: id } })

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

        const updated = await tx.devis.update({
          where: { id },
          data: {
            clientId: clientId || existing.clientId,
            dateDevis: dateDevis ? new Date(dateDevis) : existing.dateDevis,
            dateValidite: dateValidite ? new Date(dateValidite) : existing.dateValidite,
            tva: tvaValue,
            montantHT: newMontantHT,
            montantTTC: newMontantTTC,
            notes: notes !== undefined ? notes || null : existing.notes,
            lignes: {
              create: processedLines,
            },
          },
          include: {
            client: true,
            lignes: { orderBy: { ordre: 'asc' } },
          },
        })

        return updated
      } else {
        // Just update basic fields
        const tvaValue = tva ?? existing.tva
        const newMontantTTC = existing.montantHT * (1 + tvaValue / 100)

        const updated = await tx.devis.update({
          where: { id },
          data: {
            clientId: clientId || undefined,
            dateDevis: dateDevis ? new Date(dateDevis) : undefined,
            dateValidite: dateValidite ? new Date(dateValidite) : undefined,
            tva: tva !== undefined ? tva : undefined,
            montantTTC: tva !== undefined ? newMontantTTC : undefined,
            notes: notes !== undefined ? notes || null : undefined,
          },
          include: {
            client: true,
            lignes: { orderBy: { ordre: 'asc' } },
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
    console.error('Update devis error:', error)
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

    const existing = await prisma.devis.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    if (existing.statut === 'ACCEPTE' || existing.statut === 'CONVERTI') {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de supprimer un devis avec le statut ${existing.statut}`,
        },
        { status: 403 }
      )
    }

    await prisma.devis.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { message: 'Devis supprimé avec succès' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Delete devis error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
