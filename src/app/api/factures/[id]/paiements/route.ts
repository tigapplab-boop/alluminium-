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

    const paiements = await prisma.paiementFacture.findMany({
      where: { factureId: id },
      orderBy: { datePaiement: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: paiements,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List paiements facture error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { montant, modePaiement, notes } = body

    if (!montant || typeof montant !== 'number' || montant <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the facture
      const facture = await tx.facture.findUnique({
        where: { id },
        include: { client: true },
      })

      if (!facture) {
        throw new Error('Facture non trouvée')
      }

      if (facture.statut === 'ANNULEE') {
        throw new Error('Impossible d\'ajouter un paiement à une facture annulée')
      }

      // Check montant <= resteAPayer
      if (montant > facture.resteAPayer) {
        throw new Error(`Le montant (${montant}) dépasse le reste à payer (${facture.resteAPayer})`)
      }

      // Create paiement
      const paiement = await tx.paiementFacture.create({
        data: {
          factureId: id,
          montant,
          modePaiement: modePaiement || 'espèces',
          notes: notes || null,
          datePaiement: new Date(),
        },
      })

      // Update facture totals
      const newMontantPaye = facture.montantPaye + montant
      const newResteAPayer = Math.max(0, facture.resteAPayer - montant)

      let newStatut: string = 'PARTIELLEMENT_PAYEE'
      if (newResteAPayer <= 0) {
        newStatut = 'PAYEE'
      }

      const updatedFacture = await tx.facture.update({
        where: { id },
        data: {
          montantPaye: newMontantPaye,
          resteAPayer: newResteAPayer,
          statut: newStatut,
        },
      })

      // Create TransactionCaisse (ENTREE) and update Caisse
      const caisse = await tx.caisse.upsert({
        where: { id: 'default-caisse' },
        update: {},
        create: { id: 'default-caisse', solde: 0 },
      })

      const soldeAvant = caisse.solde
      const soldeApres = soldeAvant + montant

      await tx.transactionCaisse.create({
        data: {
          type: 'ENTREE',
          montant,
          soldeAvant,
          soldeApres,
          description: `Paiement facture ${facture.reference} - ${facture.client.nom}`,
          refType: 'FACTURE',
          refId: id,
          dateTransaction: new Date(),
        },
      })

      await tx.caisse.update({
        where: { id: 'default-caisse' },
        data: { solde: soldeApres },
      })

      return { paiement, facture: updatedFacture }
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
    console.error('Create paiement facture error:', error)

    if (message.includes('dépasse') || message.includes('non trouvée') || message.includes('annulée')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: message.includes('non trouvée') ? 404 : 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
