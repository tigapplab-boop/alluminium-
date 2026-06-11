import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      // Get the devis
      const devis = await tx.devis.findUnique({
        where: { id },
        include: {
          lignes: { orderBy: { ordre: 'asc' } },
          client: true,
        },
      })

      if (!devis) {
        throw new Error('Devis non trouvé')
      }

      if (devis.statut !== 'ACCEPTE') {
        throw new Error('Le devis doit être accepté avant de pouvoir être converti en facture')
      }

      // Generate facture reference: FAC-YYYY-NNNN
      const year = new Date().getFullYear()
      const yearPrefix = `FAC-${year}-`
      const lastFacture = await tx.facture.findFirst({
        where: { reference: { startsWith: yearPrefix } },
        orderBy: { reference: 'desc' },
        select: { reference: true },
      })

      let nextNum = 1
      if (lastFacture) {
        const lastNum = parseInt(lastFacture.reference.split('-').pop() || '0', 10)
        nextNum = lastNum + 1
      }
      const reference = `${yearPrefix}${String(nextNum).padStart(4, '0')}`

      // Create facture with same lines (copy)
      const facture = await tx.facture.create({
        data: {
          reference,
          clientId: devis.clientId,
          devisId: id,
          dateFacture: new Date(),
          montantHT: devis.montantHT,
          tva: devis.tva,
          montantTTC: devis.montantTTC,
          montantPaye: 0,
          resteAPayer: devis.montantTTC,
          statut: 'EN_ATTENTE',
          notes: devis.notes,
          lignes: {
            create: devis.lignes.map((line) => ({
              designation: line.designation,
              description: line.description,
              unite: line.unite,
              quantite: line.quantite,
              prixUnitaire: line.prixUnitaire,
              montantTotal: line.montantTotal,
              ordre: line.ordre,
            })),
          },
        },
        include: {
          client: true,
          lignes: { orderBy: { ordre: 'asc' } },
          devis: true,
        },
      })

      // Update devis statut to CONVERTI
      await tx.devis.update({
        where: { id },
        data: { statut: 'CONVERTI' },
      })

      return facture
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
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur'
    console.error('Convert devis error:', error)

    if (message.includes('non trouvé')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 }
      )
    }
    if (message.includes('accepté')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
