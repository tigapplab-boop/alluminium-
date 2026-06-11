import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Facture } from '@/types'
import { formatDate } from '@/lib/utils'

// Colors
const HEADER_BG = '#0B1120'
const TEXT_COLOR = '#333333'
const ACCENT = '#3B82F6'
const LINE_COLOR = '#E5E7EB'
const ROW_ALT = '#F8FAFC'
const WHITE = '#FFFFFF'
const RED = '#EF4444'
const GREEN_STAMP = '#22C55E'

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function exportFacturePdf(facture: Facture) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ── Page border ──
  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.5)
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

  // ── Header area (dark background) ──
  doc.setFillColor(HEADER_BG)
  doc.rect(margin, y, contentWidth, 28, 'F')

  // Left: AluAtelier Pro
  doc.setTextColor(WHITE)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('AluAtelier Pro', margin + 5, y + 12)

  // Right: FACTURE title + reference
  doc.setFontSize(22)
  doc.text('FACTURE', pageWidth - margin - 5, y + 10, { align: 'right' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(facture.reference, pageWidth - margin - 5, y + 18, { align: 'right' })

  // Below header: date + échéance
  doc.setTextColor(TEXT_COLOR)
  doc.setFontSize(9)
  const dateLine = `Date: ${formatDate(facture.dateFacture)}`
  doc.text(dateLine, margin, y + 35)
  if (facture.dateEcheance) {
    doc.text(`Échéance: ${formatDate(facture.dateEcheance)}`, margin + 60, y + 35)
  }

  // Status badge
  const statutLabels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    PARTIELLEMENT_PAYEE: 'Partiellement payée',
    PAYEE: 'Payée',
    ANNULEE: 'Annulée',
  }
  const statutLabel = statutLabels[facture.statut] || facture.statut
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(ACCENT)
  doc.text(`Statut: ${statutLabel}`, pageWidth - margin, y + 35, { align: 'right' })

  // Separator line
  y = y + 40
  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 5

  // ── Client section ──
  doc.setTextColor(ACCENT)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', margin, y)
  y += 5

  doc.setTextColor(TEXT_COLOR)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const clientName = facture.client
    ? `${facture.client.prenom ? facture.client.prenom + ' ' : ''}${facture.client.nom}`
    : 'Client inconnu'

  doc.text(`Nom: ${clientName}`, margin, y)
  y += 5

  if (facture.client?.telephone) {
    doc.text(`Téléphone: ${facture.client.telephone}`, margin, y)
    y += 5
  }
  if (facture.client?.adresse) {
    doc.text(`Adresse: ${facture.client.adresse}`, margin, y)
    y += 5
  }
  if (facture.client?.wilaya) {
    doc.text(`Wilaya: ${facture.client.wilaya}`, margin, y)
    y += 5
  }

  y += 5

  // ── Items table ──
  const lignes = facture.lignes || []

  const tableBody = lignes.map((ligne, index) => [
    (index + 1).toString(),
    ligne.designation,
    ligne.description || '',
    ligne.unite,
    formatNumber(ligne.quantite),
    `${formatNumber(ligne.prixUnitaire)} DA`,
    `${formatNumber(ligne.montantTotal)} DA`,
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['N°', 'Désignation', 'Description', 'Unité', 'Qté', 'P.U.', 'Total']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: TEXT_COLOR,
      lineColor: LINE_COLOR,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: HEADER_BG,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: ROW_ALT,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 30 },
    },
  })

  const lastTable1 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
  y = lastTable1?.finalY
    ? Number(lastTable1.finalY)
    : y + lignes.length * 8 + 10

  y += 8

  // ── Payment history section ──
  const paiements = facture.paiements || []

  if (paiements.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(ACCENT)
    doc.text('HISTORIQUE DES PAIEMENTS', margin, y)
    y += 2

    const paiementsBody = paiements.map((p) => [
      formatDate(p.datePaiement),
      p.modePaiement,
      `${formatNumber(p.montant)} DA`,
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Date', 'Mode', 'Montant']],
      body: paiementsBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: TEXT_COLOR,
        lineColor: LINE_COLOR,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: HEADER_BG,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: ROW_ALT,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { halign: 'center', cellWidth: 45 },
        2: { halign: 'right', cellWidth: 35 },
      },
    })

    const lastTable2 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    y = lastTable2?.finalY
      ? Number(lastTable2.finalY)
      : y + paiements.length * 8 + 10

    y += 5
  }

  // Reste à payer (if not fully paid)
  if (facture.statut !== 'PAYEE' && facture.statut !== 'ANNULEE' && facture.resteAPayer > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(RED)
    doc.text(`Reste à payer: ${formatNumber(facture.resteAPayer)} DA`, pageWidth - margin, y, {
      align: 'right',
    })
    y += 8
  }

  // ── Totals section (right-aligned) ──
  const totalsX = pageWidth - margin - 75
  const valueX = pageWidth - margin - 5

  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.2)

  // Montant HT
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(TEXT_COLOR)
  doc.text('Montant HT:', totalsX, y)
  doc.text(`${formatNumber(facture.montantHT)} DA`, valueX, y, { align: 'right' })
  y += 6

  // TVA
  doc.text(`TVA (${facture.tva}%):`, totalsX, y)
  const montantTVA = facture.montantTTC - facture.montantHT
  doc.text(`${formatNumber(montantTVA)} DA`, valueX, y, { align: 'right' })
  y += 2

  // Separator line before total
  doc.setLineWidth(0.5)
  doc.line(totalsX - 2, y, valueX + 2, y)
  y += 6

  // TOTAL TTC (bold, larger)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(HEADER_BG)
  doc.text('TOTAL TTC:', totalsX, y)
  doc.text(`${formatNumber(facture.montantTTC)} DA`, valueX, y, { align: 'right' })
  y += 6

  // Montant payé
  if (facture.montantPaye > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GREEN_STAMP)
    doc.text('Montant payé:', totalsX, y)
    doc.text(`${formatNumber(facture.montantPaye)} DA`, valueX, y, { align: 'right' })
    y += 6
  }

  y += 6

  // ── Notes section ──
  if (facture.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(ACCENT)
    doc.text('Notes:', margin, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(TEXT_COLOR)
    doc.setFontSize(8)
    const lines = doc.splitTextToSize(facture.notes, contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * 4 + 8
  }

  // ── Footer area ──
  const footerY = pageHeight - margin - 10

  doc.setDrawColor(LINE_COLOR)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 15, pageWidth - margin, footerY - 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(TEXT_COLOR)

  const signLeftX = margin + 30
  const signRightX = pageWidth - margin - 50

  doc.text('Signature client', signLeftX, footerY - 5)
  doc.line(margin, footerY, margin + 60, footerY)

  doc.text('Cachet & Signature', signRightX, footerY - 5)
  doc.line(pageWidth - margin - 80, footerY, pageWidth - margin, footerY)

  // ── PAYÉE stamp (if paid) ──
  if (facture.statut === 'PAYEE') {
    doc.saveGraphicsState()
    doc.setGState(new (doc as unknown as { GState: new (ops: Array<[string, ...unknown[]]>) => unknown }).GState([
      ['opacity', 0.3],
    ]))
    const centerX = pageWidth / 2
    const centerY = pageHeight / 2
    doc.setFontSize(60)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(GREEN_STAMP)

    // Draw rotated "PAYÉE" text diagonally
    const text = 'PAYÉE'
    const angle = Math.atan2(pageHeight, pageWidth) * (180 / Math.PI)

    doc.text(text, centerX, centerY, {
      angle: -angle,
      align: 'center',
      baseline: 'middle',
    })

    // Draw a circle around it
    const radius = 45
    doc.setDrawColor(GREEN_STAMP)
    doc.setLineWidth(2)
    doc.circle(centerX, centerY, radius)

    doc.restoreGraphicsState()
  }

  // ── Save ──
  doc.save(`Facture_${facture.reference}.pdf`)
}