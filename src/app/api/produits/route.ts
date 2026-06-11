import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'


export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const alerte = searchParams.get('alerte') === 'true'

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { designation: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type && ['PROFILE_ALU', 'VITRAGE', 'JOINT', 'QUINCAILLERIE', 'COLLE_MOUSSE', 'MOTEUR_VOLET', 'AUTRE'].includes(type)) {
      where.typeProduit = type
    }

    if (alerte) {
      where.stockActuel = { lt: 0 }
    }

    const produits = await prisma.produit.findMany({
      where,
      include: { fournisseur: true },
      orderBy: { createdAt: 'desc' },
    })

    // For alertes, we need to filter manually since stockMinimum is per-row
    const filteredData = alerte
      ? produits.filter((p) => p.stockActuel < p.stockMinimum)
      : produits

    return NextResponse.json({
      success: true,
      data: filteredData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List produits error:', error)
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
    const {
      designation,
      reference,
      typeProduit,
      unite,
      prixUnitaire,
      stockActuel,
      stockMinimum,
      fournisseurId,
    } = body

    if (!designation || typeof designation !== 'string' || designation.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'La désignation du produit est requise' },
        { status: 400 }
      )
    }

    if (!typeProduit || !['PROFILE_ALU', 'VITRAGE', 'JOINT', 'QUINCAILLERIE', 'COLLE_MOUSSE', 'MOTEUR_VOLET', 'AUTRE'].includes(typeProduit)) {
      return NextResponse.json(
        { success: false, error: 'Le type de produit est invalide' },
        { status: 400 }
      )
    }

    const produit = await prisma.produit.create({
      data: {
        designation: designation.trim(),
        reference: reference || null,
        typeProduit,
        unite: unite || 'PIECE',
        prixUnitaire: prixUnitaire ?? 0,
        stockActuel: stockActuel ?? 0,
        stockMinimum: stockMinimum ?? 0,
        fournisseurId: fournisseurId || null,
      },
      include: { fournisseur: true },
    })

    return NextResponse.json(
      {
        success: true,
        data: produit,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create produit error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
