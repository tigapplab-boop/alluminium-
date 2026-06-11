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

    const paiements = await prisma.paiementAchat.findMany({
      where: { achatId: id },
      orderBy: { datePaiement: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: paiements,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List paiements achat error:', error)
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
      // Get the achat and lock it
      const achat = await tx.achat.findUnique({
        where: { id },
        include: { fournisseur: true },
      })

      if (!achat) {
        throw new Error('Achat non trouvé')
      }

      // Check montant <= resteAPayer
      if (montant > achat.resteAPayer) {
        throw new Error(`Le montant (${montant}) dépasse le reste à payer (${achat.resteAPayer})`)
      }

      // Create paiement
      const paiement = await tx.paiementAchat.create({
        data: {
          achatId: id,
          montant,
          modePaiement: modePaiement || 'espèces',
          notes: notes || null,
          datePaiement: new Date(),
        },
      })

      // Update achat totals
      const newMontantPaye = achat.montantPaye + montant
      const newResteAPayer = Math.max(0, achat.resteAPayer - montant)

      let newStatut: string = 'PARTIELLEMENT_PAYE'
      if (newResteAPayer <= 0) {
        newStatut = 'PAYE'
      }

      const updatedAchat = await tx.achat.update({
        where: { id },
        data: {
          montantPaye: newMontantPaye,
          resteAPayer: newResteAPayer,
          statut: newStatut,
        },
      })

      // Create TransactionCaisse (SORTIE) and update Caisse
      const caisse = await tx.caisse.upsert({
        where: { id: 'default-caisse' },
        update: {},
        create: { id: 'default-caisse', solde: 0 },
      })

      const soldeAvant = caisse.solde
      const soldeApres = soldeAvant - montant

      await tx.transactionCaisse.create({
        data: {
          type: 'SORTIE',
          montant,
          soldeAvant,
          soldeApres,
          description: `Paiement achat ${achat.reference} - ${achat.fournisseur.nom}`,
          refType: 'ACHAT',
          refId: id,
          dateTransaction: new Date(),
        },
      })

      await tx.caisse.update({
        where: { id: 'default-caisse' },
        data: { solde: soldeApres },
      })

      return { paiement, achat: updatedAchat }
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
    console.error('Create paiement achat error:', error)

    if (message.includes('dépasse') || message.includes('non trouvé')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: message.includes('non trouvé') ? 404 : 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
