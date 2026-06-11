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

    const achat = await prisma.achat.findUnique({
      where: { id },
      include: {
        lignes: {
          include: { produit: true },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
        },
        fournisseur: true,
      },
    })

    if (!achat) {
      return NextResponse.json(
        { success: false, error: 'Achat non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: achat,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get achat error:', error)
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
    const { fournisseurId, dateAchat, notes, lignes } = body

    const existing = await prisma.achat.findUnique({
      where: { id },
      include: {
        lignes: { include: { produit: true } },
        paiements: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Achat non trouvé' },
        { status: 404 }
      )
    }

    if (existing.statut === 'PAYE') {
      return NextResponse.json(
        { success: false, error: 'Impossible de modifier un achat entièrement payé' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // If lines are provided, recalculate everything
      if (lignes && Array.isArray(lignes)) {
        // Revert stock changes from old lines
        for (const oldLine of existing.lignes) {
          if (oldLine.produitId) {
            await tx.produit.update({
              where: { id: oldLine.produitId },
              data: { stockActuel: { decrement: oldLine.quantite } },
            })
          }
        }

        // Delete old lines
        await tx.ligneAchat.deleteMany({ where: { achatId: id } })

        // Create new lines and update stock
        const processedLines = lignes.map((line: Record<string, unknown>) => ({
          designation: line.designation as string,
          produitId: (line.produitId as string) || null,
          quantite: line.quantite as number,
          prixUnitaire: line.prixUnitaire as number,
          montantTotal: (line.quantite as number) * (line.prixUnitaire as number),
        }))

        const newMontantTotal = processedLines.reduce((sum: number, l: { montantTotal: number }) => sum + l.montantTotal, 0)
        const newResteAPayer = newMontantTotal - existing.montantPaye

        // Update stock for new lines
        for (const line of lignes) {
          if (line.produitId) {
            await tx.produit.update({
              where: { id: line.produitId as string },
              data: { stockActuel: { increment: line.quantite as number } },
            })
          }
        }

        // Determine new status
        let newStatut: string = 'NON_PAYE'
        if (newResteAPayer <= 0) {
          newStatut = 'PAYE'
        } else if (existing.montantPaye > 0) {
          newStatut = 'PARTIELLEMENT_PAYE'
        }

        const updated = await tx.achat.update({
          where: { id },
          data: {
            fournisseurId: fournisseurId || existing.fournisseurId,
            dateAchat: dateAchat ? new Date(dateAchat) : existing.dateAchat,
            montantTotal: newMontantTotal,
            resteAPayer: Math.max(0, newResteAPayer),
            statut: newStatut,
            notes: notes !== undefined ? notes || null : existing.notes,
            lignes: {
              create: processedLines,
            },
          },
          include: {
            fournisseur: true,
            lignes: { include: { produit: true } },
            paiements: true,
          },
        })

        return updated
      } else {
        // Just update basic fields
        const updated = await tx.achat.update({
          where: { id },
          data: {
            fournisseurId: fournisseurId || undefined,
            dateAchat: dateAchat ? new Date(dateAchat) : undefined,
            notes: notes !== undefined ? notes || null : undefined,
          },
          include: {
            fournisseur: true,
            lignes: { include: { produit: true } },
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
    console.error('Update achat error:', error)
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

    const existing = await prisma.achat.findUnique({
      where: { id },
      include: {
        lignes: { include: { produit: true } },
        _count: { select: { paiements: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Achat non trouvé' },
        { status: 404 }
      )
    }

    if (existing._count.paiements > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer un achat ayant des paiements' },
        { status: 403 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Revert stock changes
      for (const line of existing.lignes) {
        if (line.produitId) {
          await tx.produit.update({
            where: { id: line.produitId },
            data: { stockActuel: { decrement: line.quantite } },
          })
        }
      }

      // Delete achat (cascade will delete lignes)
      await tx.achat.delete({ where: { id } })
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Achat supprimé avec succès' },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Delete achat error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
