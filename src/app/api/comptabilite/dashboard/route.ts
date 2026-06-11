import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    // Solde caisse
    const caisse = await prisma.caisse.upsert({
      where: { id: 'default-caisse' },
      update: {},
      create: { id: 'default-caisse', solde: 0 },
    })

    // Total achats all time
    const achatsAgg = await prisma.achat.aggregate({
      _sum: { montantTotal: true },
    })
    const totalAchatsAllTime = achatsAgg._sum.montantTotal || 0

    // Total recettes all time (paiements factures)
    const recettesAgg = await prisma.paiementFacture.aggregate({
      _sum: { montant: true },
    })
    const totalRecettesAllTime = recettesAgg._sum.montant || 0

    // Bénéfice
    const beneficeAllTime = totalRecettesAllTime - totalAchatsAllTime

    // Impayes clients (factures)
    const impayesClientsAgg = await prisma.facture.aggregate({
      where: {
        statut: { not: 'ANNULEE' },
        resteAPayer: { gt: 0 },
      },
      _sum: { resteAPayer: true },
      _count: true,
    })
    const impayesClients = impayesClientsAgg._sum.resteAPayer || 0
    const nbImpayesClients = impayesClientsAgg._count || 0

    // Impayes fournisseurs (achats)
    const impayesFournisseursAgg = await prisma.achat.aggregate({
      where: {
        resteAPayer: { gt: 0 },
      },
      _sum: { resteAPayer: true },
      _count: true,
    })
    const impayesFournisseurs = impayesFournisseursAgg._sum.resteAPayer || 0
    const nbImpayesFournisseurs = impayesFournisseursAgg._count || 0

    // Associés with totalRetire
    const associes = await prisma.associe.findMany({
      include: {
        retraits: {
          select: { montant: true },
        },
      },
    })

    const associesData = associes.map((a) => ({
      id: a.id,
      nom: a.nom,
      prenom: a.prenom,
      telephone: a.telephone,
      partPct: a.partPct,
      totalRetire: a.retraits.reduce((sum, r) => sum + r.montant, 0),
    }))

    return NextResponse.json({
      success: true,
      data: {
        soldeCaisse: caisse.solde,
        totalAchatsAllTime,
        totalRecettesAllTime,
        beneficeAllTime,
        impayes: {
          clients: {
            total: impayesClients,
            count: nbImpayesClients,
          },
          fournisseurs: {
            total: impayesFournisseurs,
            count: nbImpayesFournisseurs,
          },
        },
        associes: associesData,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Dashboard comptabilite error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
