import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, requireAdmin } from '@/lib/authMiddleware'


export async function POST(request: NextRequest) {
  try {
    const { error, user } = await authenticate(request)
    if (error) return error

    const adminError = requireAdmin(user!)
    if (adminError) return adminError

    const body = await request.json()
    const { montant, description, type } = body

    if (!montant || typeof montant !== 'number' || montant <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      )
    }

    if (!type || (type !== 'AJOUT' && type !== 'RETRAIT')) {
      return NextResponse.json(
        { success: false, error: 'Le type doit être AJOUT ou RETRAIT' },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'La description est requise' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const caisse = await tx.caisse.upsert({
        where: { id: 'default-caisse' },
        update: {},
        create: { id: 'default-caisse', solde: 0 },
      })

      const soldeAvant = caisse.solde
      let soldeApres: number

      if (type === 'AJOUT') {
        soldeApres = soldeAvant + montant
      } else {
        soldeApres = soldeAvant - montant
      }

      const transaction = await tx.transactionCaisse.create({
        data: {
          type: 'AJUSTEMENT',
          montant,
          soldeAvant,
          soldeApres,
          description,
          dateTransaction: new Date(),
        },
      })

      await tx.caisse.update({
        where: { id: 'default-caisse' },
        data: { solde: soldeApres },
      })

      return transaction
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
    console.error('Ajustement caisse error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
