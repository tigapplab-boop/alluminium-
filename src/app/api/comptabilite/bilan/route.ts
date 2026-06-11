import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { success: false, error: 'Les paramètres from et to sont requis' },
        { status: 400 }
      )
    }

    const from = new Date(fromParam)
    const to = new Date(toParam)

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Les dates doivent être valides' },
        { status: 400 }
      )
    }

    // Achats totals for period
    const achatsAgg = await prisma.achat.aggregate({
      where: {
        dateAchat: { gte: from, lte: to },
      },
      _sum: { montantTotal: true, montantPaye: true },
      _count: true,
    })

    // Recettes (paiements factures) for period
    const recettesAgg = await prisma.paiementFacture.aggregate({
      where: {
        datePaiement: { gte: from, lte: to },
      },
      _sum: { montant: true },
      _count: true,
    })

    // Paiements achats for period
    const paiementsAchatsAgg = await prisma.paiementAchat.aggregate({
      where: {
        datePaiement: { gte: from, lte: to },
      },
      _sum: { montant: true },
      _count: true,
    })

    // Transactions caisse for period
    const entreesAgg = await prisma.transactionCaisse.aggregate({
      where: {
        type: 'ENTREE',
        dateTransaction: { gte: from, lte: to },
      },
      _sum: { montant: true },
    })

    const sortiesAgg = await prisma.transactionCaisse.aggregate({
      where: {
        type: 'SORTIE',
        dateTransaction: { gte: from, lte: to },
      },
      _sum: { montant: true },
    })

    const retraitsAgg = await prisma.transactionCaisse.aggregate({
      where: {
        type: 'RETRAIT',
        dateTransaction: { gte: from, lte: to },
      },
      _sum: { montant: true },
    })

    // Devis stats for period
    const devisAgg = await prisma.devis.aggregate({
      where: {
        dateDevis: { gte: from, lte: to },
      },
      _sum: { montantTTC: true },
      _count: true,
    })

    // Factures stats for period
    const facturesAgg = await prisma.facture.aggregate({
      where: {
        dateFacture: { gte: from, lte: to },
        statut: { not: 'ANNULEE' },
      },
      _sum: { montantTTC: true, montantPaye: true, resteAPayer: true },
      _count: true,
    })

    const totalAchats = achatsAgg._sum.montantTotal || 0
    const totalRecettes = recettesAgg._sum.montant || 0
    const benefice = totalRecettes - totalAchats

    return NextResponse.json({
      success: true,
      data: {
        periode: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
        achats: {
          total: totalAchats,
          paye: achatsAgg._sum.montantPaye || 0,
          count: achatsAgg._count || 0,
        },
        recettes: {
          total: totalRecettes,
          count: recettesAgg._count || 0,
        },
        benefice,
        caisse: {
          entrees: entreesAgg._sum.montant || 0,
          sorties: sortiesAgg._sum.montant || 0,
          retraits: retraitsAgg._sum.montant || 0,
          paiementsFournisseurs: paiementsAchatsAgg._sum.montant || 0,
        },
        devis: {
          total: devisAgg._sum.montantTTC || 0,
          count: devisAgg._count || 0,
        },
        factures: {
          total: facturesAgg._sum.montantTTC || 0,
          paye: facturesAgg._sum.montantPaye || 0,
          impaye: facturesAgg._sum.resteAPayer || 0,
          count: facturesAgg._count || 0,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Bilan comptabilite error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
