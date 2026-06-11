import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate } from '@/lib/authMiddleware'

export async function GET(request: NextRequest) {
  try {
    const { error } = await authenticate(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: { devis: true, factures: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: clients,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('List clients error:', error)
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
    const { nom, prenom, telephone, adresse, wilaya, notes } = body

    if (!nom || typeof nom !== 'string' || nom.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le nom du client est requis' },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        nom: nom.trim(),
        prenom: prenom || null,
        telephone: telephone || null,
        adresse: adresse || null,
        wilaya: wilaya || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: client,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
