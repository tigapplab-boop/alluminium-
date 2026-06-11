import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, requireAdmin } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const where: Record<string, unknown> = {}

    if (from || to) {
      where.dateRetrait = {}
      if (from) {
        (where.dateRetrait as Record<string, unknown>).gte = new Date(from)
      }
      if (to) {
        (where.dateRetrait as Record<string, unknown>).lte = new Date(to)
      }
    }

    const retraits = await prisma.retraitCaisse.findMany({
      where,
      include: {
        associe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
          },
        },
      },
      orderBy: { dateRetrait: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: retraits,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List retraits caisse error:', error)
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
    const { associeId, montant, notes } = body

    if (!associeId) {
      return NextResponse.json(
        { success: false, error: 'L\'associé est requis' },
        { status: 400 }
      )
    }

    if (!montant || typeof montant !== 'number' || montant <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      )
    }

    // Verify associe exists
    const associe = await prisma.associe.findUnique({ where: { id: associeId } })
    if (!associe) {
      return NextResponse.json(
        { success: false, error: 'Associé non trouvé' },
        { status: 404 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check caisse solde
      const caisse = await tx.caisse.upsert({
        where: { id: 'default-caisse' },
        update: {},
        create: { id: 'default-caisse', solde: 0 },
      })

      if (montant > caisse.solde) {
        throw new Error(`Solde insuffisant. Solde actuel: ${caisse.solde}, montant demandé: ${montant}`)
      }

      // Create RetraitCaisse
      const retrait = await tx.retraitCaisse.create({
        data: {
          associeId,
          montant,
          dateRetrait: new Date(),
          notes: notes || null,
        },
        include: {
          associe: true,
        },
      })

      // Create TransactionCaisse (RETRAIT)
      const soldeAvant = caisse.solde
      const soldeApres = soldeAvant - montant

      await tx.transactionCaisse.create({
        data: {
          type: 'RETRAIT',
          montant,
          soldeAvant,
          soldeApres,
          description: `Retrait ${associe.nom} ${associe.prenom}`,
          refType: 'RETRAIT',
          refId: retrait.id,
          dateTransaction: new Date(),
        },
      })

      // Update Caisse.solde
      await tx.caisse.update({
        where: { id: 'default-caisse' },
        data: { solde: soldeApres },
      })

      return retrait
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
    console.error('Create retrait caisse error:', error)

    if (message.includes('Solde insuffisant')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }
    if (message.includes('non trouvé')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
